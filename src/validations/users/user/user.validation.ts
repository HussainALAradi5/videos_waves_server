import { z } from 'zod'
import { Gender } from '../../../enums/users/user/gender.enum'
import { REGEX } from '../../../constants/common/regex.constants'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { RESERVED_USER_NAMES, USER_LIMITS } from '../../../constants/users/user/user.constants'

export const userNameSchema = z.string().trim().regex(REGEX.USER_NAME, MESSAGES.USERS.USER_NAME_RULE)

/** For new or changed usernames: also rejects names that collide with /users/<segment> routes. */
export const newUserNameSchema = userNameSchema.refine(
  (value) => !(RESERVED_USER_NAMES as readonly string[]).includes(value.toLowerCase()),
  MESSAGES.USERS.USER_NAME_RESERVED
)

export const emailSchema = z.email().trim().toLowerCase().max(USER_LIMITS.EMAIL_MAX)

export const passwordSchema = z.string().regex(REGEX.PASSWORD, MESSAGES.USERS.PASSWORD_RULE)

export const genderSchema = z.enum(Gender)

export const bioSchema = z.string().trim().max(USER_LIMITS.BIO_MAX)
