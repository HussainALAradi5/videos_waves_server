import { z } from 'zod'
import { bioSchema, emailSchema, userNameSchema } from '../../../validations/users/user/user.validation'

export const updateProfileSchema = z
  .object({
    userName: userNameSchema.optional(),
    email: emailSchema.optional(),
    bio: bioSchema.optional()
  })
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, { message: 'Provide at least one field to update.' })

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
