import type { Server } from 'socket.io'

/**
 * The Socket.IO server, set once at startup. Services emit through chat-events.service and never
 * import this directly; when it is unset (tests, scripts) events are simply not sent.
 */
let realtimeServer: Server | null = null

export const setRealtimeServer = (server: Server | null): void => {
  realtimeServer = server
}

export const getRealtimeServer = (): Server | null => realtimeServer
