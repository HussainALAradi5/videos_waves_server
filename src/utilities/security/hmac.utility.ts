import { createHmac, timingSafeEqual } from 'crypto'

export const hmacSha1 = (secret: string, value: string): string =>
  createHmac('sha1', secret).update(value).digest('hex')

/** Constant-time comparison so signature checks do not leak timing information. */
export const isSameSignature = (expected: string, actual: string): boolean => {
  const left = Buffer.from(expected)
  const right = Buffer.from(actual)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const nowInSeconds = (): number => Math.floor(Date.now() / 1000)
