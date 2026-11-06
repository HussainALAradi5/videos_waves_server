export const USER_CODE_PREFIX = 'USR'
export const USER_SORT_FIELDS = ['createdAt', 'userName', 'email'] as const
export const USER_PUBLIC_FIELDS = 'userName avatarUrl'
export const USER_LIMITS = { EMAIL_MAX: 254, AVATAR_URL_MAX: 2048, BIO_MAX: 150 } as const

export type UserCounter = 'followersCount' | 'followingCount' | 'videosCount'
