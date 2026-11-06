export const USER_CODE_PREFIX = 'USR'
export const USER_SORT_FIELDS = ['createdAt', 'userName', 'email'] as const
export const USER_PUBLIC_FIELDS = 'userName image'
export const USER_LIMITS = { EMAIL_MAX: 254, IMAGE_URL_MAX: 2048 } as const
