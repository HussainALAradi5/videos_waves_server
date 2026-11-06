import type { HydratedDocument, Types } from 'mongoose'
import { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import { MessageKind } from '../../../enums/chat/message/message-kind.enum'
import type { SystemAction } from '../../../enums/chat/message/system-action.enum'
import type { Message } from '../../../interfaces/models/chat/message/message.interface'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { conversationMemberRepository } from '../../../repositories/chat/conversation-member/conversation-member.repository'
import { messageRepository } from '../../../repositories/chat/message/message.repository'
import { previewOf } from '../../../mappers/chat/message/message.mapper'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { emitToUsers } from '../realtime/chat-events.service'
import { buildMessageView } from './message-view.service'

/**
 * Stores a message and updates everything that depends on it: the inbox preview, each member's
 * unread count and sort time, and un-hiding the chat for people who deleted it. Call inside a
 * transaction, then `broadcastMessages` once it has committed.
 */
export const postMessage = async (
  conversationId: string,
  senderId: string,
  data: Partial<Message>
): Promise<HydratedDocument<Message>> => {
  const message = await messageRepository.create(
    { ...data, conversation: toObjectId(conversationId), sender: toObjectId(senderId) },
    senderId
  )
  await conversationRepository.setLastMessage(conversationId, {
    message: message._id,
    sender: message.sender,
    kind: message.kind,
    preview: previewOf(message),
    createdAt: message.createdAt
  })
  await conversationMemberRepository.recordNewMessage(conversationId, senderId, message.createdAt)
  return message
}

export const postSystemMessage = (
  conversationId: string,
  actorId: string,
  action: SystemAction,
  target: Types.ObjectId | null = null
) => postMessage(conversationId, actorId, { kind: MessageKind.SYSTEM, systemAction: action, systemTarget: target })

/** Delivers committed messages live to every current member's devices. */
export const broadcastMessages = async (conversationId: string, messages: Message[], extraUserIds: string[] = []) => {
  const memberIds = await conversationMemberRepository.findActiveUserIds(conversationId)
  const recipients = [...new Set([...memberIds, ...extraUserIds])]
  for (const message of messages) {
    emitToUsers(recipients, ChatEvent.MESSAGE_NEW, await buildMessageView(message, message.sender.toString()))
  }
}

/** Tells members to refetch a conversation (rename, members, roles, request accepted). */
export const broadcastConversationChange = async (conversationId: string, extraUserIds: string[] = []) => {
  const memberIds = await conversationMemberRepository.findActiveUserIds(conversationId)
  emitToUsers([...new Set([...memberIds, ...extraUserIds])], ChatEvent.CONVERSATION_UPDATED, { conversationId })
}
