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
    LOGGED_OUT: 'You have been signed out.',
    LOGGED_OUT_EVERYWHERE: 'You have been signed out on every device.',
    REFRESH_REUSED: 'This session was signed out for your security. Please sign in again.',
    SESSION_NOT_FOUND: 'Session not found.'
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
    PASSWORDS_MISMATCH: 'New password and confirmation do not match.',
    USER_NAME_RESERVED: 'This username is reserved.'
  },
  SOCIAL: {
    CANNOT_FOLLOW_SELF: 'You cannot follow yourself.',
    CANNOT_BLOCK_SELF: 'You cannot block yourself.',
    CANNOT_RESTRICT_SELF: 'You cannot restrict yourself.',
    UNBLOCK_FIRST: 'Unblock this account first.',
    FOLLOWING_REQUIRED: 'Sign in and follow people to see their videos here.'
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
  CHAT: {
    NOT_FOUND: 'Chat not found.',
    NOT_A_MEMBER: 'You are not in this chat.',
    MESSAGE_NOT_FOUND: 'Message not found.',
    MESSAGE_EMPTY: 'A message needs text, attachments, a voice note, or a shared video.',
    VOICE_NOTE_ALONE: 'A voice note is sent on its own.',
    CANNOT_MESSAGE_SELF: 'You cannot message yourself.',
    CANNOT_MESSAGE_USER: 'You cannot message this account.',
    MESSAGES_FOLLOWING_ONLY: 'This account only accepts messages from people it follows.',
    GROUP_ONLY: 'This works only in group chats.',
    ADMIN_REQUIRED: 'Only group admins can do this.',
    LAST_ADMIN: 'Make someone else an admin before stepping down.',
    GROUP_FULL: 'This group is full.',
    ALREADY_MEMBER: 'Everyone listed is already in this group.',
    REQUEST_PENDING: 'Accept the message request before replying.',
    NOT_SENDER: 'Only the sender can do this.',
    EDIT_WINDOW_PASSED: 'Messages can be edited for 15 minutes after sending.',
    CANNOT_EDIT: 'Only text messages can be edited.',
    ALREADY_UNSENT: 'This message was unsent.',
    REPLY_NOT_FOUND: 'The message you are replying to is not in this chat.',
    LEFT: 'Chat deleted.'
  },
  COMMENTS: {
    NOT_FOUND: 'Comment not found.',
    DELETED: 'Comment deleted.',
    UNDO_EXPIRED: 'This comment can no longer be restored.',
    NOT_PENDING: 'This comment does not need approval.'
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
