import { z } from 'zod'
import { normalizePhone } from '../../../utilities/users/contact.utility'
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

/** Optional and private: stored normalised to E.164, used only for exact-match people search. */
export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((value) => REGEX.PHONE.test(value), MESSAGES.USERS.PHONE_RULE)

export const bioSchema = z.string().trim().max(USER_LIMITS.BIO_MAX)
