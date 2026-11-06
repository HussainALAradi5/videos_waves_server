import type { z } from 'zod'
import { USER_SEARCH_SORT_FIELDS } from '../../../constants/users/user/user.constants'
import { buildPageRequestSchema, searchSchema } from '../../../validations/common/pagination.validation'

/** Public people search (Search tab, new message, add to group). */
export const userSearchQuerySchema = buildPageRequestSchema(USER_SEARCH_SORT_FIELDS, 'followersCount').extend({
  search: searchSchema
})

export type UserSearchQueryDto = z.infer<typeof userSearchQuerySchema>
