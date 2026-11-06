export const MIGRATION_CODE_PREFIX = 'MIG'

/** Collection names the legacy migration reads and writes (legacy names plus the current ones it fills). */
export const LEGACY_COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  COMMENTS: 'comments',
  ADMIN_REQUESTS: 'requests',
  NEW_ADMIN_REQUESTS: 'adminrequests',
  MEDIA: 'media',
  VIDEO_LIKES: 'videolikes'
} as const

/** The legacy app accepted any upload but served everything as video. */
export const LEGACY_VIDEO_MIME = 'video/mp4'
