import { randomBytes } from 'crypto'
import { CODE_TOKEN_LENGTH } from '../../constants/common/limits.constants'

// Crockford-style alphabet without ambiguous characters (0/O, 1/I/L).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export const generateCode = (prefix: string, length: number = CODE_TOKEN_LENGTH): string => {
  const bytes = randomBytes(length)
  let token = ''
  for (const byte of bytes) {
    token += ALPHABET[byte % ALPHABET.length]
  }
  return `${prefix}-${token}`
}
