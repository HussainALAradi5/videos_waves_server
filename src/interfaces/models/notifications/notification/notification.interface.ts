import type { Types } from 'mongoose'
import type { NotificationKind } from '../../../../enums/notifications/notification/notification-kind.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

/** One entry in a person's notification bell. */
export interface Notification extends BaseEntity {
  user: Types.ObjectId
  kind: NotificationKind
  /** Who caused it; null for system notifications. */
  actor: Types.ObjectId | null
  /** The video, conversation, or request it is about (builds the link). */
  targetId: Types.ObjectId | null
  /** A short subject shown in the text: a video or group title. */
  subject: string
  readAt: Date | null
}
