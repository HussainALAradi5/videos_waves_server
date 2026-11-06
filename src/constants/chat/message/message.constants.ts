export const MESSAGE_CODE_PREFIX = 'MSG'
export const MESSAGE_REACTION_CODE_PREFIX = 'RCT'
export const MESSAGE_LIMITS = {
  BODY_MAX: 2000,
  MAX_ATTACHMENTS: 10,
  /** Senders can edit a text message for 15 minutes, as on Instagram. */
  EDIT_WINDOW_MS: 15 * 60 * 1000,
  PREVIEW_MAX: 80
} as const
/** The reaction picker; anything else is rejected so reactions stay a small, renderable set. */
export const MESSAGE_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '👏'] as const

/** Inbox previews for messages without text. */
export const MESSAGE_PREVIEWS = {
  ATTACHMENT: 'Sent an attachment',
  ATTACHMENTS: 'Sent attachments',
  VOICE: 'Sent a voice message',
  VIDEO_SHARE: 'Shared a video',
  UNSENT: 'Unsent a message',
  SYSTEM: 'Group updated'
} as const
