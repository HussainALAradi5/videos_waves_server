import { z } from 'zod'
import { NOTIFICATION_SORT_FIELDS } from '../../../constants/notifications/notification/notification.constants'
import { buildPageRequestSchema } from '../../../validations/common/pagination.validation'

export const notificationQuerySchema = buildPageRequestSchema(NOTIFICATION_SORT_FIELDS, 'createdAt').extend({
  /** `unread` shows only unread ones. */
  filter: z.enum(['all', 'unread']).default('all')
})

export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>
