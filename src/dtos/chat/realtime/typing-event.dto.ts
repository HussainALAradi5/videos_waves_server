import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

/** Sent by clients while the composer has text (true) and when it is cleared or sent (false). */
export const typingEventSchema = z.object({ conversationId: objectIdSchema, isTyping: z.boolean() })

export type TypingEventDto = z.infer<typeof typingEventSchema>
