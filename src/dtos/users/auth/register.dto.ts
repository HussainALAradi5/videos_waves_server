import { z } from 'zod'
import { emailSchema, newUserNameSchema, passwordSchema } from '../../../validations/users/user/user.validation'

export const registerSchema = z.object({
  userName: newUserNameSchema,
  email: emailSchema,
  password: passwordSchema
})

export type RegisterDto = z.infer<typeof registerSchema>
