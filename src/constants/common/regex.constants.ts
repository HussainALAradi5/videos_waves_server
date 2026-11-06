export const REGEX = {
  OBJECT_ID: /^[a-f\d]{24}$/i,
  USER_NAME: /^[a-zA-Z0-9_.]{3,30}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/,
  /** E.164 after normalisation: a plus, a country code, 8 to 15 digits in all. */
  PHONE: /^\+[1-9]\d{7,14}$/,
  SPECIAL_CHARACTERS: /[.*+?^${}()|[\]\\]/g,
  /** `/videos-waves/<kind>/<userId>`: the only folders uploads may target (no traversal possible). */
  MEDIA_FOLDER: /^\/videos-waves\/(video|avatar|chat_attachment|voice_note)\/[a-f\d]{24}$/i,
  /** A file the local provider stored: `<folder>/<uuid>[.ext]`; group 1 is the media kind. */
  LOCAL_MEDIA_PATH: /^\/videos-waves\/(video|avatar|chat_attachment|voice_note)\/[a-f\d]{24}\/[a-f\d-]{36}(\.[a-z0-9]{1,5})?$/i
} as const
