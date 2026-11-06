import { describe, expect, it } from 'vitest'
import { buildPageRequestSchema } from '../../../src/validations/common/pagination.validation'
import { PAGINATION } from '../../../src/constants/common/limits.constants'

const schema = buildPageRequestSchema(['createdAt', 'title'] as const, 'createdAt')

describe('pagination validation', () => {
  it('applies defaults and coerces query strings', () => {
    expect(schema.parse({ page: '2' })).toEqual({
      page: 2,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    })
  })

  it('rejects page sizes above the maximum', () => {
    expect(schema.safeParse({ pageSize: PAGINATION.MAX_PAGE_SIZE + 1 }).success).toBe(false)
  })

  it('rejects sort fields outside the allowlist', () => {
    expect(schema.safeParse({ sortBy: 'passwordHash' }).success).toBe(false)
  })
})
