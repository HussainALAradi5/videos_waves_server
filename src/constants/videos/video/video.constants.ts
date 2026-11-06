export const VIDEO_CODE_PREFIX = 'VID'
export const VIDEO_LIKE_CODE_PREFIX = 'LIK'
export const VIDEO_SORT_FIELDS = ['createdAt', 'likesCount', 'viewsCount', 'title'] as const
export const VIDEO_LIMITS = { TITLE_MIN: 1, TITLE_MAX: 120, DESCRIPTION_MAX: 2000 } as const
