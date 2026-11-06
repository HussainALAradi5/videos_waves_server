export const MESSAGES = {
  COMMON: {
    INTERNAL_ERROR: 'Something went wrong. Please try again later.',
    VALIDATION_FAILED: 'The request contains invalid data.',
    ROUTE_NOT_FOUND: 'The requested route does not exist.',
    TOO_MANY_REQUESTS: 'Too many requests. Please slow down and try again later.'
  },
  AUTH: {
    TOKEN_MISSING: 'Authentication is required.',
    TOKEN_INVALID: 'Your session is invalid or has expired.',
    REFRESH_INVALID: 'The refresh token is invalid or has expired.',
    INVALID_CREDENTIALS: 'Invalid username, email, or password.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    LOGGED_OUT: 'You have been signed out.'
  },
  USERS: {
    NOT_FOUND: 'User not found.',
    EMAIL_TAKEN: 'An account with this email already exists.',
    USER_NAME_TAKEN: 'This username is already taken.',
    CURRENT_PASSWORD_INCORRECT: 'The current password is incorrect.',
    PASSWORD_CHANGED: 'Your password has been changed. Please sign in again.',
    DEACTIVATED: 'Your account has been deactivated.',
    USER_NAME_RULE: 'Username must be 3-30 characters: letters, numbers, dots, or underscores.',
    PASSWORD_RULE: 'Password must be 8-72 characters with upper and lower case letters and a number.',
    PASSWORDS_MISMATCH: 'New password and confirmation do not match.'
  },
  VIDEOS: {
    NOT_FOUND: 'Video not found.',
    FILE_REQUIRED: 'A video file is required.',
    FILE_TYPE_INVALID: 'Only video files can be uploaded.',
    FILE_TOO_LARGE: 'The video file is too large.',
    DELETED: 'Video deleted.'
  },
  COMMENTS: {
    NOT_FOUND: 'Comment not found.',
    DELETED: 'Comment deleted.'
  },
  ADMIN_REQUESTS: {
    NOT_FOUND: 'Admin request not found.',
    ALREADY_ADMIN: 'You are already an admin.',
    PENDING_EXISTS: 'You already have a pending admin request.',
    ALREADY_DECIDED: 'This request has already been decided.',
    CANCELLED: 'Admin request cancelled.'
  },
  VALIDATION: {
    INVALID_ID: 'Invalid identifier.',
    INVALID_SORT_FIELD: 'Unsupported sort field.'
  }
} as const
