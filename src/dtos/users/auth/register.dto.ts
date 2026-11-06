import { z } from 'zod'
import { emailSchema, passwordSchema, userNameSchema } from '../../../validations/users/user/user.validation'

export const registerSchema = z.object({
  userName: userNameSchema,
  email: emailSchema,
  password: passwordSchema
})

export type RegisterDto = z.infer<typeof registerSchema>
