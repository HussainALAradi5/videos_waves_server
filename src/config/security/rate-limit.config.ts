import { RATE_LIMITS } from '../../constants/common/limits.constants'
import { env } from '../index'

// Automated tests send many auth requests from one address; production keeps strict limits.
const isTest = env.NODE_ENV === 'test'

export const rateLimitConfig = {
  general: { windowMs: RATE_LIMITS.WINDOW_MS, limit: isTest ? Number.MAX_SAFE_INTEGER : RATE_LIMITS.GENERAL_MAX },
  auth: { windowMs: RATE_LIMITS.WINDOW_MS, limit: isTest ? Number.MAX_SAFE_INTEGER : RATE_LIMITS.AUTH_MAX }
}
