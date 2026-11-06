import { z } from 'zod'
import { Role } from '../../../enums/users/roles/role.enum'

export const updateUserRoleSchema = z.object({ role: z.enum(Role) }).strict()

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>
