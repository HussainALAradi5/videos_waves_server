export const COMMENT_CODE_PREFIX = 'CMT'
export const COMMENT_SORT_FIELDS = ['createdAt'] as const
export const COMMENT_LIMITS = { CONTENT_MIN: 1, CONTENT_MAX: 1000 } as const
/** How long the person who deleted a comment can undo it (the client shows an Undo toast). */
export const COMMENT_UNDO_WINDOW_MS = 15 * 1000
