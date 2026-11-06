import type { HydratedDocument } from 'mongoose'
import type { ChatMemberResponseDto } from '../../../dtos/chat/conversation/chat-member-response.dto'
import type { ConversationResponseDto } from '../../../dtos/chat/conversation/conversation-response.dto'
import type { Conversation } from '../../../interfaces/models/chat/conversation/conversation.interface'
import type { ConversationMember } from '../../../interfaces/models/chat/conversation-member/conversation-member.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import { toPublicUser } from '../../users/user/user.mapper'
import type { ChatMemberStatus } from '../../../interfaces/models/chat/conversation-member/chat-member-status.interface'

type ConversationSource = Conversation | HydratedDocument<Conversation>

/** Read and online status stay private when the member restricted the viewer or turned them off in settings. */
const isMutedNow = (mutedUntil: Date | null): boolean => mutedUntil !== null && mutedUntil.getTime() > Date.now()

export const toChatMember = (
  member: ConversationMember,
  user: PublicUserSource,
  status: ChatMemberStatus
): ChatMemberResponseDto => ({
  user: toPublicUser(user),
  role: member.role,
  lastReadAt: status.hidesReads ? null : (member.lastReadAt?.toISOString() ?? null),
  isOnline: status.hidesActivity ? null : status.isOnline
})

export const toConversationResponse = (
  conversation: ConversationSource,
  me: ConversationMember,
  members: ChatMemberResponseDto[]
): ConversationResponseDto => ({
  id: conversation._id.toString(),
  code: conversation.code,
  type: conversation.type,
  title: conversation.title,
  members,
  membersCount: conversation.membersCount,
  me: {
    role: me.role,
    status: me.status,
    unreadCount: me.unreadCount,
    isMuted: isMutedNow(me.mutedUntil),
    mutedUntil: isMutedNow(me.mutedUntil) ? me.mutedUntil!.toISOString() : null
  },
  lastMessage: conversation.lastMessage
    ? {
        id: conversation.lastMessage.message.toString(),
        senderId: conversation.lastMessage.sender.toString(),
        kind: conversation.lastMessage.kind,
        preview: conversation.lastMessage.preview,
        createdAt: conversation.lastMessage.createdAt.toISOString()
      }
    : null,
  lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
  createdAt: conversation.createdAt.toISOString()
})
