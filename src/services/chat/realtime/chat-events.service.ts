import type { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { getRealtimeServer } from '../../../globals/realtime/realtime.globals'
import { userRoom } from '../../../utilities/realtime/room.utility'

/** Sends one event to every device of every listed user. */
export const emitToUsers = (userIds: string[], event: ChatEvent, payload: unknown): void => {
  const server = getRealtimeServer()
  if (!server || userIds.length === 0) return
  server.to(userIds.map(userRoom)).emit(event, payload)
}

/** Closes the sockets of revoked sessions, or every socket of the user when `sessionIds` is omitted. */
export const disconnectSessions = (userId: string, sessionIds?: string[]): void => {
  const server = getRealtimeServer()
  if (!server) return
  void server
    .in(userRoom(userId))
    .fetchSockets()
    .then((sockets) => {
      for (const socket of sockets) {
        const sessionId = (socket.data.user as AuthUser | undefined)?.sessionId
        if (!sessionIds || (sessionId !== undefined && sessionIds.includes(sessionId))) socket.disconnect(true)
      }
    })
}
