import { z } from 'zod'
import { PAGINATION } from '../../../constants/common/limits.constants'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

/** Shared cursor page request: `before` is the id of the oldest item already loaded. */
export const cursorRequestSchema = z.object({
  before: objectIdSchema.optional(),
  pageSize: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_CURSOR_PAGE_SIZE)
})

export type CursorRequestDto = z.infer<typeof cursorRequestSchema>
