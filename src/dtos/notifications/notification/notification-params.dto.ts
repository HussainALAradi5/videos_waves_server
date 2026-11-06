import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const notificationParamsSchema = z.object({ notificationId: objectIdSchema })

export type NotificationParamsDto = z.infer<typeof notificationParamsSchema>
