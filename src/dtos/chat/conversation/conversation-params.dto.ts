import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const conversationParamsSchema = z.object({ conversationId: objectIdSchema })

export type ConversationParamsDto = z.infer<typeof conversationParamsSchema>
