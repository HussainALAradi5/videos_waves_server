import type { ConversationType } from '../../../../enums/chat/conversation/conversation-type.enum'
import type { BaseEntity } from '../../base/base-entity.interface'
import type { LastMessageSnapshot } from './last-message-snapshot.interface'

export interface Conversation extends BaseEntity {
  type: ConversationType
  /** Group name; null for direct chats (clients show the other person). */
  title: string | null
  /** Sorted pair of user ids for direct chats, unique, so each pair has exactly one chat. */
  directKey: string | null
  lastMessage: LastMessageSnapshot | null
  lastMessageAt: Date | null
  membersCount: number
}
