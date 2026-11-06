import { describe, expect, it } from 'vitest'
import { buildPageMeta, toSkip, toSort } from '../../../src/utilities/pagination/paginate.utility'
import { SortDirection } from '../../../src/enums/common/sort-direction.enum'

describe('paginate utility', () => {
  it('computes the offset from page and page size', () => {
    expect(toSkip(1, 10)).toBe(0)
    expect(toSkip(3, 10)).toBe(20)
  })

  it('builds a stable sort with an _id tie-breaker', () => {
    const request = { page: 1, pageSize: 10, sortBy: 'createdAt', sortDirection: SortDirection.ASC }
    expect(toSort(request)).toEqual({ createdAt: 1, _id: 1 })
    expect(toSort({ ...request, sortDirection: SortDirection.DESC })).toEqual({ createdAt: -1, _id: -1 })
  })

  it('reports total pages, including the empty case', () => {
    expect(buildPageMeta(1, 10, 0)).toEqual({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 })
    expect(buildPageMeta(2, 10, 21)).toEqual({ page: 2, pageSize: 10, totalItems: 21, totalPages: 3 })
  })
})
