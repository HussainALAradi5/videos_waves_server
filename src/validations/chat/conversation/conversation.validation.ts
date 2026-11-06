import { z } from 'zod'
import { CONVERSATION_LIMITS } from '../../../constants/chat/conversation/conversation.constants'

export const groupTitleSchema = z.string().trim().min(CONVERSATION_LIMITS.TITLE_MIN).max(CONVERSATION_LIMITS.TITLE_MAX)
