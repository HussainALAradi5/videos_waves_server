import type { Socket } from 'socket.io'
import { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import { typingEventSchema } from '../../../dtos/chat/realtime/typing-event.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { markConnected, markDisconnected } from '../../../services/chat/realtime/presence.service'
import { broadcastPresence, relayTyping } from '../../../services/chat/realtime/realtime-relay.service'
import { logger } from '../../../utilities/logging/logger.utility'
import { userRoom } from '../../../utilities/realtime/room.utility'

const logFailure = (event: string) => (error: unknown) =>
  logger.error(`Socket ${event} failed`, { error: error instanceof Error ? error.message : String(error) })

/** One authenticated connection: joins the user's room, tracks presence, and relays typing. */
export const handleConnection = (socket: Socket): void => {
  const user = socket.data.user as AuthUser
  void socket.join(userRoom(user.id))
  if (markConnected(user.id)) broadcastPresence(user.id, true).catch(logFailure('presence'))

  socket.on(ChatEvent.TYPING, (payload: unknown) => {
    const parsed = typingEventSchema.safeParse(payload)
    if (parsed.success) relayTyping(user.id, parsed.data).catch(logFailure('typing'))
  })

  socket.on('disconnect', () => {
    if (markDisconnected(user.id)) broadcastPresence(user.id, false).catch(logFailure('presence'))
  })
}
