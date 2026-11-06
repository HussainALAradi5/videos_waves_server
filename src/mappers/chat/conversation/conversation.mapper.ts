import type { HydratedDocument } from 'mongoose'
import type { ChatMemberResponseDto } from '../../../dtos/chat/conversation/chat-member-response.dto'
import type { ConversationResponseDto } from '../../../dtos/chat/conversation/conversation-response.dto'
import type { Conversation } from '../../../interfaces/models/chat/conversation/conversation.interface'
import type { ConversationMember } from '../../../interfaces/models/chat/conversation-member/conversation-member.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import { toPublicUser } from '../../users/user/user.mapper'

type ConversationSource = Conversation | HydratedDocument<Conversation>

/** `hidesStatus` is true for members who restricted the viewer: their read and online status stay private. */
export const toChatMember = (
  member: ConversationMember,
  user: PublicUserSource,
  hidesStatus: boolean,
  isOnline: boolean
): ChatMemberResponseDto => ({
  user: toPublicUser(user),
  role: member.role,
  lastReadAt: hidesStatus ? null : (member.lastReadAt?.toISOString() ?? null),
  isOnline: hidesStatus ? null : isOnline
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
    isMuted: me.mutedUntil !== null && me.mutedUntil.getTime() > Date.now()
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
