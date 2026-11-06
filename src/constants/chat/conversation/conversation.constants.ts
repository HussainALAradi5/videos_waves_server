export const CONVERSATION_CODE_PREFIX = 'CNV'
export const CONVERSATION_MEMBER_CODE_PREFIX = 'CMB'
/** Stored as `mutedUntil` for "mute until I unmute". */
export const MUTED_FOREVER = new Date('9999-12-31T00:00:00.000Z')

const HOUR_MS = 60 * 60 * 1000

/** Milliseconds each timed mute lasts; `always` uses MUTED_FOREVER and `off` clears it. */
export const MUTE_DURATION_MS = { '8h': 8 * HOUR_MS, '1w': 7 * 24 * HOUR_MS } as const

export const CONVERSATION_SORT_FIELDS = ['lastMessageAt', 'createdAt'] as const
export const CONVERSATION_LIMITS = {
  TITLE_MIN: 1,
  TITLE_MAX: 60,
  /** Instagram allows 32 people in a group chat, the creator included. */
  GROUP_MAX_MEMBERS: 32,
  GROUP_MIN_INVITEES: 2,
  /** Longest mute option (one week) when not muting indefinitely. */
  MUTE_MAX_HOURS: 24 * 7
} as const
