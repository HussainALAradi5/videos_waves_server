import { z } from 'zod'
import { USER_IMPORT_MAX_ROWS } from '../../../constants/users/user/user-transfer.constants'
import { Role } from '../../../enums/users/roles/role.enum'
import { emailSchema, genderSchema, newUserNameSchema } from '../../../validations/users/user/user.validation'

/** The client parses the CSV file and sends its rows; each row is validated like a registration. */
export const importUsersSchema = z.object({
  rows: z
    .array(
      z.object({
        userName: newUserNameSchema,
        email: emailSchema,
        gender: genderSchema,
        role: z.enum(Role).default(Role.USER)
      })
    )
    .min(1)
    .max(USER_IMPORT_MAX_ROWS)
})

export type ImportUsersDto = z.infer<typeof importUsersSchema>
