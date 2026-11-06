import type { Types } from 'mongoose'
import type { MessageKind } from '../../../../enums/chat/message/message-kind.enum'
import type { SystemAction } from '../../../../enums/chat/message/system-action.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface Message extends BaseEntity {
  conversation: Types.ObjectId
  sender: Types.ObjectId
  kind: MessageKind
  body: string | null
  /** Media records (chat attachments or one voice note). */
  attachments: Types.ObjectId[]
  replyTo: Types.ObjectId | null
  sharedVideo: Types.ObjectId | null
  systemAction: SystemAction | null
  /** The user a system notice is about (who was added, removed, promoted). */
  systemTarget: Types.ObjectId | null
  editedAt: Date | null
  /** Unsent for everyone: content is removed, a placeholder stays. */
  unsentAt: Date | null
  /** Members who deleted this message for themselves only. */
  deletedFor: Types.ObjectId[]
}
