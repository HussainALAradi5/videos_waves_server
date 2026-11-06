import type { ChatBackground } from '../../../enums/chat/conversation/chat-background.enum'
import type { BaseEntityResponseDto } from '../../common/base/base-entity-response.dto'
import type { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import type { MemberRole } from '../../../enums/chat/conversation/member-role.enum'
import type { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import type { MessageKind } from '../../../enums/chat/message/message-kind.enum'
import type { ChatMemberResponseDto } from './chat-member-response.dto'

export interface ConversationResponseDto extends BaseEntityResponseDto {
  type: ConversationType
  title: string | null
  /** Everyone except the viewer. */
  members: ChatMemberResponseDto[]
  membersCount: number
  /** `mutedUntil` is null when not muted; far in the future means until unmuted. */
  me: {
    role: MemberRole
    status: MemberStatus
    unreadCount: number
    isMuted: boolean
    mutedUntil: string | null
    /** Only the viewer's own wallpaper for this chat. */
    background: ChatBackground
  }
  lastMessage: { id: string; senderId: string; kind: MessageKind; preview: string; createdAt: string } | null
  lastMessageAt: string | null
}
