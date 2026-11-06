export const SESSION_CODE_PREFIX = 'SES'
export const SESSION_LIMITS = {
  USER_AGENT_MAX: 200,
  /**
   * Two tabs (or an app and its widget) can refresh with the same token at once. Within this
   * window the older token still works once, instead of being treated as stolen.
   */
  ROTATION_GRACE_MS: 30 * 1000
} as const
