import { z } from 'zod'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { passwordSchema } from '../../../validations/users/user/user.validation'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1)
  })
  .refine((dto) => dto.newPassword === dto.confirmPassword, {
    message: MESSAGES.USERS.PASSWORDS_MISMATCH,
    path: ['confirmPassword']
  })

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>
