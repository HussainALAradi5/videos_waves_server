import { z } from 'zod'
import { PAGINATION, SEARCH_MAX_LENGTH } from '../../constants/common/limits.constants'
import { MESSAGES } from '../../constants/common/messages.constants'
import { SortDirection } from '../../enums/common/sort-direction.enum'

/** Shared page request schema; each list passes its own sort allowlist and default sort field. */
export const buildPageRequestSchema = <const TFields extends readonly [string, ...string[]]>(
  sortFields: TFields,
  defaultSort: TFields[number]
) =>
  z.object({
    page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
    pageSize: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
    sortBy: z.enum(sortFields, { error: MESSAGES.VALIDATION.INVALID_SORT_FIELD }).default(defaultSort as never),
    sortDirection: z.enum(SortDirection).default(SortDirection.DESC)
  })

export const searchSchema = z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional()
