import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const messageParamsSchema = z.object({ conversationId: objectIdSchema, messageId: objectIdSchema })

export type MessageParamsDto = z.infer<typeof messageParamsSchema>
