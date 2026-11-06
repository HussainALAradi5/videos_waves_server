import { describe, expect, it } from 'vitest'
import { groupBy } from '../../../src/utilities/collections/group-by.utility'

describe('groupBy', () => {
  it('groups in input order and returns an empty map for no items', () => {
    const groups = groupBy(['apple', 'avocado', 'banana'], (word) => word[0])
    expect([...groups.entries()]).toEqual([
      ['a', ['apple', 'avocado']],
      ['b', ['banana']]
    ])
    expect(groupBy([], String).size).toBe(0)
  })
})
