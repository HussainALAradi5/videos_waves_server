import { z } from 'zod'
import { emailSchema, genderSchema, newUserNameSchema, passwordSchema } from '../../../validations/users/user/user.validation'

export const registerSchema = z.object({
  userName: newUserNameSchema,
  gender: genderSchema,
  email: emailSchema,
  password: passwordSchema
})

export type RegisterDto = z.infer<typeof registerSchema>
