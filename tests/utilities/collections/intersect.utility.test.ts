import { describe, expect, it } from 'vitest'
import { intersectAll } from '../../../src/utilities/collections/intersect.utility'
import { buildDirectKey } from '../../../src/utilities/chat/conversation.utility'

describe('intersectAll', () => {
  it('keeps values present in every list', () => {
    expect(intersectAll([['a', 'b', 'c'], ['c', 'a'], ['a', 'c', 'x']])).toEqual(['a', 'c'])
    expect(intersectAll([])).toEqual([])
  })
})

describe('buildDirectKey', () => {
  it('is the same whichever person starts the chat', () => {
    expect(buildDirectKey('b', 'a')).toBe(buildDirectKey('a', 'b'))
  })
})
