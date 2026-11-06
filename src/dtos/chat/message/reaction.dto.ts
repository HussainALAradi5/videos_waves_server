import { z } from 'zod'
import { MESSAGE_REACTIONS } from '../../../constants/chat/message/message.constants'

export const reactionSchema = z.object({ emoji: z.enum(MESSAGE_REACTIONS) })

export type ReactionDto = z.infer<typeof reactionSchema>
