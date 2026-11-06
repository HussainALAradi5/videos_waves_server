import { z } from 'zod'
import { bioSchema, emailSchema, genderSchema, newUserNameSchema } from '../../../validations/users/user/user.validation'

export const updateProfileSchema = z
  .object({
    userName: newUserNameSchema.optional(),
    email: emailSchema.optional(),
    bio: bioSchema.optional(),
    gender: genderSchema.optional()
  })
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, { message: 'Provide at least one field to update.' })

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
