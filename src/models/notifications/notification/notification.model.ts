import { Schema, model } from 'mongoose'
import { NOTIFICATION_CODE_PREFIX } from '../../../constants/notifications/notification/notification.constants'
import { NotificationKind } from '../../../enums/notifications/notification/notification-kind.enum'
import type { Notification } from '../../../interfaces/models/notifications/notification/notification.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const notificationSchema = new Schema<Notification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: Object.values(NotificationKind), required: true },
  actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  targetId: { type: Schema.Types.ObjectId, default: null },
  subject: { type: String, default: '', maxlength: 120 },
  readAt: { type: Date, default: null }
})
notificationSchema.plugin(baseEntityPlugin, { codePrefix: NOTIFICATION_CODE_PREFIX })
// The bell: one person's newest first, and their unread count.
notificationSchema.index({ user: 1, deletedAt: 1, createdAt: -1 })
notificationSchema.index({ user: 1, readAt: 1 })

export const NotificationModel = model<Notification>('Notification', notificationSchema)
