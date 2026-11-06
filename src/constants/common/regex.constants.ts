export const REGEX = {
  OBJECT_ID: /^[a-f\d]{24}$/i,
  USER_NAME: /^[a-zA-Z0-9_.]{3,30}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/,
  SPECIAL_CHARACTERS: /[.*+?^${}()|[\]\\]/g
} as const
