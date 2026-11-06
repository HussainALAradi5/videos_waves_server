import type { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import { getRealtimeServer } from '../../../globals/realtime/realtime.globals'
import { userRoom } from '../../../utilities/realtime/room.utility'

/** Sends one event to every device of every listed user. */
export const emitToUsers = (userIds: string[], event: ChatEvent, payload: unknown): void => {
  const server = getRealtimeServer()
  if (!server || userIds.length === 0) return
  server.to(userIds.map(userRoom)).emit(event, payload)
}
