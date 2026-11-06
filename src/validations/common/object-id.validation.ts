import { z } from 'zod'
import { REGEX } from '../../constants/common/regex.constants'
import { MESSAGES } from '../../constants/common/messages.constants'

export const objectIdSchema = z.string().regex(REGEX.OBJECT_ID, MESSAGES.VALIDATION.INVALID_ID)
