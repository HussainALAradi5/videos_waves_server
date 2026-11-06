import { z } from 'zod'
import { MESSAGE_LIMITS } from '../../../constants/chat/message/message.constants'

export const editMessageSchema = z.object({ body: z.string().trim().min(1).max(MESSAGE_LIMITS.BODY_MAX) })

export type EditMessageDto = z.infer<typeof editMessageSchema>
