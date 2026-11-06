export const USER_CODE_PREFIX = 'USR'
export const USER_SORT_FIELDS = ['createdAt', 'userName', 'email'] as const
export const USER_SEARCH_SORT_FIELDS = ['followersCount', 'userName', 'createdAt'] as const
/** Path segments under /users that must never be usernames. */
export const RESERVED_USER_NAMES = ['me', 'search', 'admin-requests', 'export', 'import'] as const
export const USER_PUBLIC_FIELDS = 'userName avatarUrl gender'

/** Usernames are unique and looked up ignoring case ("Lina" and "lina" are the same person); they display as typed. */
export const USERNAME_COLLATION = { locale: 'en', strength: 2 } as const
export const USERNAME_INDEX_NAME = 'userName_ci'
export const USER_LIMITS = { EMAIL_MAX: 254, AVATAR_URL_MAX: 2048, BIO_MAX: 150 } as const

export type UserCounter = 'followersCount' | 'followingCount' | 'videosCount'
