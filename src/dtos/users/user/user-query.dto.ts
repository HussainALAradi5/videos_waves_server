import { z } from 'zod'
import { AccountStatus } from '../../../enums/users/user/account-status.enum'
import { USER_SORT_FIELDS } from '../../../constants/users/user/user.constants'
import { Role } from '../../../enums/users/roles/role.enum'
import { buildPageRequestSchema, searchSchema } from '../../../validations/common/pagination.validation'

export const userQuerySchema = buildPageRequestSchema(USER_SORT_FIELDS, 'createdAt').extend({
  search: searchSchema,
  role: z.enum(Role).optional(),
  status: z.enum(AccountStatus).optional()
})

export type UserQueryDto = z.infer<typeof userQuerySchema>
