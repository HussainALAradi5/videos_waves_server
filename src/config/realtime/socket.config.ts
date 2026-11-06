import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { SOCKET_PATH } from '../../constants/chat/realtime/realtime.constants'
import { handleConnection } from '../../controllers/chat/realtime/chat-socket.controller'
import { setRealtimeServer } from '../../globals/realtime/realtime.globals'
import { socketAuth } from '../../middlewares/realtime/socket-auth.middleware'
import { env } from '../index'

/** Attaches Socket.IO to the HTTP server with the same origin allowlist as the REST API. */
export const attachRealtime = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    path: SOCKET_PATH,
    cors: { origin: env.CORS_ORIGINS, methods: ['GET', 'POST'] }
  })
  io.use((socket, next) => void socketAuth(socket, next))
  io.on('connection', handleConnection)
  setRealtimeServer(io)
  return io
}
