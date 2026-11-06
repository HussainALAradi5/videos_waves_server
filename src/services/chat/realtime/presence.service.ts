/**
 * In-memory presence: open sockets per user. Enough for one server process; with several
 * processes this moves to the Socket.IO Redis adapter (listed in the docs as a scaling limit).
 */
const openSockets = new Map<string, number>()

/** Returns true when this is the user's first open socket (they just came online). */
export const markConnected = (userId: string): boolean => {
  const count = (openSockets.get(userId) ?? 0) + 1
  openSockets.set(userId, count)
  return count === 1
}

/** Returns true when the user's last socket closed (they just went offline). */
export const markDisconnected = (userId: string): boolean => {
  const count = (openSockets.get(userId) ?? 1) - 1
  if (count <= 0) openSockets.delete(userId)
  else openSockets.set(userId, count)
  return count <= 0
}

export const isOnline = (userId: string): boolean => openSockets.has(userId)
