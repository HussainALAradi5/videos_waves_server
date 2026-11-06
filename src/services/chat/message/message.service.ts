import { MESSAGES } from '../../../constants/common/messages.constants'
import { MESSAGE_LIMITS } from '../../../constants/chat/message/message.constants'
import { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import { DeleteScope } from '../../../enums/chat/message/delete-scope.enum'
import { MessageKind } from '../../../enums/chat/message/message-kind.enum'
import { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'
import type { CursorRequestDto } from '../../../dtos/common/pagination/cursor-request.dto'
import type { EditMessageDto } from '../../../dtos/chat/message/edit-message.dto'
import type { MessageParamsDto } from '../../../dtos/chat/message/message-params.dto'
import type { MessageResponseDto } from '../../../dtos/chat/message/message-response.dto'
import type { SendMessageDto } from '../../../dtos/chat/message/send-message.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { CursorPage } from '../../../interfaces/common/pagination/cursor-page.interface'
import type { Message } from '../../../interfaces/models/chat/message/message.interface'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { conversationMemberRepository } from '../../../repositories/chat/conversation-member/conversation-member.repository'
import { messageRepository } from '../../../repositories/chat/message/message.repository'
import { messageReactionRepository } from '../../../repositories/chat/message-reaction/message-reaction.repository'
import { previewOf } from '../../../mappers/chat/message/message.mapper'
import { buildCursorPage } from '../../../utilities/pagination/paginate.utility'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { conflict, forbidden, notFound } from '../../../utilities/errors/app-error.utility'
import { isSameId, toObjectId } from '../../../utilities/ids/object-id.utility'
import { isBlockedEitherWay } from '../../users/visibility/visibility.service'
import { claimMedia, releaseMedia } from '../../media/media/media.service'
import { purgeProviderFiles } from '../../media/media/media-cleanup.service'
import { findVideoOrFail } from '../../videos/video/video.service'
import { findConversationOrFail, findMembershipOrFail } from '../conversation/chat-access.service'
import { emitToUsers } from '../realtime/chat-events.service'
import { broadcastMessages, postMessage } from './message-posting.service'
import { buildMessageView, buildMessageViews } from './message-view.service'

const findMessageOrFail = async (params: MessageParamsDto) => {
  const message = await messageRepository.findInConversation(params.conversationId, params.messageId)
  if (!message) throw notFound(MESSAGES.CHAT.MESSAGE_NOT_FOUND)
  return message
}

/** Older messages first page by cursor; people who left can still read up to when they left. */
export const listMessages = async (
  conversationId: string,
  query: CursorRequestDto,
  actor: AuthUser
): Promise<CursorPage<MessageResponseDto>> => {
  const member = await findMembershipOrFail(conversationId, actor.id, true)
  const rows = await messageRepository.findThreadPage(member, query.before, query.pageSize)
  const page = buildCursorPage(rows, query.pageSize)
  return { items: await buildMessageViews(page.items, actor.id), meta: page.meta }
}

/** Direct chats stop working when either person blocks the other; requests must be accepted before replying. */
const assertCanSend = async (conversationId: string, actor: AuthUser) => {
  const conversation = await findConversationOrFail(conversationId)
  const member = await findMembershipOrFail(conversationId, actor.id)
  if (member.status === MemberStatus.REQUEST) throw forbidden(MESSAGES.CHAT.REQUEST_PENDING)
  if (conversation.type === ConversationType.DIRECT) {
    const others = (await conversationMemberRepository.findActiveUserIds(conversationId)).filter((id) => id !== actor.id)
    for (const otherId of others) {
      if (await isBlockedEitherWay(actor.id, otherId)) throw forbidden(MESSAGES.CHAT.CANNOT_MESSAGE_USER)
    }
  }
}

const resolveKind = (dto: SendMessageDto): MessageKind => {
  if (dto.voiceNoteId) return MessageKind.VOICE
  if (dto.attachmentIds) return MessageKind.MEDIA
  if (dto.sharedVideoId) return MessageKind.VIDEO_SHARE
  return MessageKind.TEXT
}

export const sendMessage = async (
  conversationId: string,
  dto: SendMessageDto,
  actor: AuthUser
): Promise<MessageResponseDto> => {
  await assertCanSend(conversationId, actor)
  if (dto.replyToId) {
    const target = await messageRepository.findInConversation(conversationId, dto.replyToId)
    if (!target) throw notFound(MESSAGES.CHAT.REPLY_NOT_FOUND)
  }
  if (dto.sharedVideoId) await findVideoOrFail(dto.sharedVideoId, actor.id)
  const message = await withTransaction(async () => {
    const attachments = dto.voiceNoteId
      ? await claimMedia([dto.voiceNoteId], MediaKind.VOICE_NOTE, actor)
      : dto.attachmentIds
        ? await claimMedia(dto.attachmentIds, MediaKind.CHAT_ATTACHMENT, actor)
        : []
    return postMessage(conversationId, actor.id, {
      kind: resolveKind(dto),
      body: dto.body ?? null,
      attachments: attachments.map((media) => media._id),
      replyTo: dto.replyToId ? toObjectId(dto.replyToId) : null,
      sharedVideo: dto.sharedVideoId ? toObjectId(dto.sharedVideoId) : null
    })
  })
  await broadcastMessages(conversationId, [message])
  return buildMessageView(message, actor.id)
}

/** Refreshes the inbox preview when the changed message is the newest one. */
const refreshPreviewIfLatest = async (conversationId: string, message: Message): Promise<void> => {
  const conversation = await conversationRepository.findById(conversationId)
  const last = conversation?.lastMessage
  if (!last || !last.message.equals(message._id)) return
  await conversationRepository.setLastMessage(conversationId, {
    message: last.message,
    sender: last.sender,
    kind: last.kind,
    preview: previewOf(message),
    createdAt: last.createdAt
  })
}

const broadcastUpdate = async (conversationId: string, message: Message): Promise<MessageResponseDto> => {
  const view = await buildMessageView(message, message.sender.toString())
  emitToUsers(await conversationMemberRepository.findActiveUserIds(conversationId), ChatEvent.MESSAGE_UPDATED, view)
  return view
}

/** The sender may fix a text for MESSAGE_LIMITS.EDIT_WINDOW_MS after sending. */
export const editMessage = async (params: MessageParamsDto, dto: EditMessageDto, actor: AuthUser): Promise<MessageResponseDto> => {
  await findMembershipOrFail(params.conversationId, actor.id)
  const message = await findMessageOrFail(params)
  if (!isSameId(message.sender, actor.id)) throw forbidden(MESSAGES.CHAT.NOT_SENDER)
  if (message.unsentAt) throw conflict(MESSAGES.CHAT.ALREADY_UNSENT)
  if (message.kind === MessageKind.SYSTEM || message.kind === MessageKind.VOICE || !message.body) {
    throw conflict(MESSAGES.CHAT.CANNOT_EDIT)
  }
  if (Date.now() - message.createdAt.getTime() > MESSAGE_LIMITS.EDIT_WINDOW_MS) throw conflict(MESSAGES.CHAT.EDIT_WINDOW_PASSED)
  const updated = await messageRepository.updateById(params.messageId, { $set: { body: dto.body, editedAt: new Date() } }, actor.id)
  if (!updated) throw notFound(MESSAGES.CHAT.MESSAGE_NOT_FOUND)
  await refreshPreviewIfLatest(params.conversationId, updated)
  return broadcastUpdate(params.conversationId, updated)
}

/**
 * `me` hides the message for the caller only. `everyone` unsends it (sender only): the content,
 * attachments, and reactions are removed for all members and the files are deleted from the CDN.
 */
export const deleteMessage = async (params: MessageParamsDto, scope: DeleteScope, actor: AuthUser): Promise<void> => {
  await findMembershipOrFail(params.conversationId, actor.id, true)
  const message = await findMessageOrFail(params)
  if (scope === DeleteScope.ME) return messageRepository.hideFor(params.messageId, actor.id)
  if (!isSameId(message.sender, actor.id)) throw forbidden(MESSAGES.CHAT.NOT_SENDER)
  if (message.unsentAt) return
  const mediaIds = message.attachments.map(String)
  const unsent = await withTransaction(async () => {
    await releaseMedia(mediaIds, actor.id)
    await messageReactionRepository.removeAllForMessage(params.messageId)
    return messageRepository.updateById(
      params.messageId,
      { $set: { unsentAt: new Date(), body: null, attachments: [], sharedVideo: null } },
      actor.id
    )
  })
  await purgeProviderFiles(mediaIds)
  if (!unsent) return
  await refreshPreviewIfLatest(params.conversationId, unsent)
  await broadcastUpdate(params.conversationId, unsent)
}

/** Sets, replaces, or (with `emoji: null`) removes the caller's reaction, and tells everyone live. */
export const setReaction = async (params: MessageParamsDto, emoji: string | null, actor: AuthUser): Promise<MessageResponseDto> => {
  await findMembershipOrFail(params.conversationId, actor.id)
  const message = await findMessageOrFail(params)
  if (message.unsentAt || message.kind === MessageKind.SYSTEM) throw conflict(MESSAGES.CHAT.ALREADY_UNSENT)
  if (emoji) await messageReactionRepository.setReaction(params.messageId, params.conversationId, actor.id, emoji)
  else await messageReactionRepository.removeReaction(params.messageId, actor.id)
  const view = await buildMessageView(message, actor.id)
  emitToUsers(await conversationMemberRepository.findActiveUserIds(params.conversationId), ChatEvent.MESSAGE_REACTION, {
    conversationId: params.conversationId,
    messageId: params.messageId,
    userId: actor.id,
    emoji,
    reactions: view.reactions
  })
  return view
}
