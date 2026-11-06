export const USER_EXPORT_FILE_NAME = 'videos-waves-users.csv'

/** Exports stop here so one request cannot stream the whole collection. */
export const USER_EXPORT_MAX_ROWS = 5000

/** One import request creates at most this many accounts. */
export const USER_IMPORT_MAX_ROWS = 500

export const USER_EXPORT_COLUMNS = [
  'code',
  'userName',
  'email',
  'role',
  'gender',
  'status',
  'videosCount',
  'followersCount',
  'followingCount',
  'createdAt'
] as const

export const USER_IMPORT_SKIP_REASONS = {
  EMAIL_TAKEN: 'email already used',
  USER_NAME_TAKEN: 'username already used',
  DUPLICATE_IN_FILE: 'listed twice in this import'
} as const
