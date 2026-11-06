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
    DELETED: 'Video deleted.'
  },
  MEDIA: {
    NOT_FOUND: 'Media not found.',
    FILE_NOT_UPLOADED: 'The uploaded file could not be found. Please upload it again.',
    FILE_REQUIRED: 'A file is required.',
    WRONG_FOLDER: 'This file was not uploaded for your account.',
    WRONG_VISIBILITY: 'This file was uploaded with the wrong privacy setting.',
    TYPE_NOT_ALLOWED: 'This file type is not allowed here.',
    TOO_LARGE: 'The file is too large.',
    ALREADY_USED: 'This file is already in use.',
    WRONG_KIND: 'This file cannot be used here.',
    UPLOAD_SIGNATURE_INVALID: 'The upload signature is invalid or has expired.',
    LOCAL_PROVIDER_ONLY: 'Direct uploads to this server are disabled.',
    DELIVERY_SIGNATURE_INVALID: 'This link is invalid or has expired.',
    DELETED: 'Upload removed.'
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
