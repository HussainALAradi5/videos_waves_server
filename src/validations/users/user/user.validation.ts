import { z } from 'zod'
import { REGEX } from '../../../constants/common/regex.constants'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_LIMITS } from '../../../constants/users/user/user.constants'

export const userNameSchema = z.string().trim().regex(REGEX.USER_NAME, MESSAGES.USERS.USER_NAME_RULE)

export const emailSchema = z.email().trim().toLowerCase().max(USER_LIMITS.EMAIL_MAX)

export const passwordSchema = z.string().regex(REGEX.PASSWORD, MESSAGES.USERS.PASSWORD_RULE)

export const bioSchema = z.string().trim().max(USER_LIMITS.BIO_MAX)
