import type { ChatBackground } from '../../../../enums/chat/conversation/chat-background.enum'
import type { Types } from 'mongoose'
import type { MemberRole } from '../../../../enums/chat/conversation/member-role.enum'
import type { MemberStatus } from '../../../../enums/chat/conversation/member-status.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface ConversationMember extends BaseEntity {
  conversation: Types.ObjectId
  user: Types.ObjectId
  role: MemberRole
  status: MemberStatus
  /** Messages after this are unread; also drives "Seen" for the other members. */
  lastReadAt: Date | null
  /** Copy of the conversation's lastMessageAt, so the inbox sorts on this collection alone. */
  lastMessageAt: Date | null
  /** Kept as a counter so the inbox and badge need no per-chat count queries. */
  unreadCount: number
  /** null: not muted. A far-future date means muted until unmuted. */
  mutedUntil: Date | null
  /** This member's own wallpaper for this chat. */
  background: ChatBackground
  /** Set when the member left or was removed; they keep the history up to this point. */
  leftAt: Date | null
  /** "Delete chat" for me: hidden from my inbox until a newer message arrives. */
  hiddenAt: Date | null
}
