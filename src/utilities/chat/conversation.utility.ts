/** The same key for both people regardless of who starts the chat. */
export const buildDirectKey = (firstUserId: string, secondUserId: string): string =>
  [firstUserId, secondUserId].sort().join(':')
