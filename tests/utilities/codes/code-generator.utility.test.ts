import { describe, expect, it } from 'vitest'
import { generateCode } from '../../../src/utilities/codes/code-generator.utility'

describe('code generator utility', () => {
  it('prefixes the code and uses only unambiguous characters', () => {
    const code = generateCode('VID')
    expect(code).toMatch(/^VID-[2-9A-HJKMNP-Z]{8}$/)
  })

  it('produces distinct codes', () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateCode('VID')))
    expect(codes.size).toBe(500)
  })
})
