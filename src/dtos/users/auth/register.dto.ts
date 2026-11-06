import { z } from 'zod'
import { emailSchema, genderSchema, newUserNameSchema, passwordSchema, phoneSchema } from '../../../validations/users/user/user.validation'

export const registerSchema = z.object({
  userName: newUserNameSchema,
  gender: genderSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema
})

export type RegisterDto = z.infer<typeof registerSchema>
