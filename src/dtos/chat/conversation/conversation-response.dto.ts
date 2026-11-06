import type { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import type { MemberRole } from '../../../enums/chat/conversation/member-role.enum'
import type { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import type { MessageKind } from '../../../enums/chat/message/message-kind.enum'
import type { ChatMemberResponseDto } from './chat-member-response.dto'

export interface ConversationResponseDto {
  id: string
  code: string
  type: ConversationType
  title: string | null
  /** Everyone except the viewer. */
  members: ChatMemberResponseDto[]
  membersCount: number
  me: { role: MemberRole; status: MemberStatus; unreadCount: number; isMuted: boolean }
  lastMessage: { id: string; senderId: string; kind: MessageKind; preview: string; createdAt: string } | null
  lastMessageAt: string | null
  createdAt: string
}
