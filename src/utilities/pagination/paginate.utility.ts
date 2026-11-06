import type { SortOrder } from 'mongoose'
import { SortDirection } from '../../enums/common/sort-direction.enum'
import type { PageRequestDto } from '../../dtos/common/pagination/page-request.dto'
import type { PageMeta } from '../../interfaces/common/pagination/page-meta.interface'
import type { CursorMeta } from '../../interfaces/common/pagination/cursor-meta.interface'

export const toSkip = (page: number, pageSize: number): number => (page - 1) * pageSize

export const toSort = (request: PageRequestDto): Record<string, SortOrder> => {
  const direction: SortOrder = request.sortDirection === SortDirection.ASC ? 1 : -1
  // Secondary sort on _id keeps pages stable when the primary field has ties.
  return { [request.sortBy]: direction, _id: direction }
}

export const buildPageMeta = (page: number, pageSize: number, totalItems: number): PageMeta => ({
  page,
  pageSize,
  totalItems,
  totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
})

/**
 * Cursor pages fetch one extra row to learn whether more exist, so no count query is needed.
 * `rows` must be sorted newest first and hold at most `pageSize + 1` items.
 */
export const buildCursorPage = <T extends { _id: { toString(): string } }>(
  rows: T[],
  pageSize: number
): { items: T[]; meta: CursorMeta } => {
  const hasMore = rows.length > pageSize
  const items = hasMore ? rows.slice(0, pageSize) : rows
  return { items, meta: { pageSize, hasMore, nextCursor: hasMore ? items[items.length - 1]._id.toString() : null } }
}
