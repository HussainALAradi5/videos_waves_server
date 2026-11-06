export const BYTES_PER_MEGABYTE = 1024 * 1024

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50
} as const

export const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000,
  GENERAL_MAX: 1000,
  AUTH_MAX: 20
} as const

export const JSON_BODY_LIMIT = '1mb'

export const CODE_TOKEN_LENGTH = 8

export const SEARCH_MAX_LENGTH = 100
