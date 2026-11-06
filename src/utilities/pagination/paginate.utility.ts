import type { SortOrder } from 'mongoose'
import { SortDirection } from '../../enums/common/sort-direction.enum'
import type { PageRequestDto } from '../../dtos/common/pagination/page-request.dto'
import type { PageMeta } from '../../interfaces/common/pagination/page-meta.interface'

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
