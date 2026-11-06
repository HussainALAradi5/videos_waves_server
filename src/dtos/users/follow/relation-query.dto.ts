import type { z } from 'zod'
import { RELATION_SORT_FIELDS } from '../../../constants/users/follow/follow.constants'
import { buildPageRequestSchema } from '../../../validations/common/pagination.validation'

/** Paging for followers, following, blocked, and restricted lists (newest first). */
export const relationQuerySchema = buildPageRequestSchema(RELATION_SORT_FIELDS, 'createdAt')

export type RelationQueryDto = z.infer<typeof relationQuerySchema>
