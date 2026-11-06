import type { Socket } from 'socket.io'
import { MESSAGES } from '../../constants/common/messages.constants'
import { resolveAccessToken } from '../../services/users/auth/session.service'

/**
 * Accepts a socket only with a valid access token in `handshake.auth.token` (the same check as
 * HTTP requests) and stores the user on `socket.data.user`.
 */
export const socketAuth = async (socket: Socket, next: (error?: Error) => void): Promise<void> => {
  const token: unknown = socket.handshake.auth?.token
  if (typeof token !== 'string' || token.length === 0) {
    next(new Error(MESSAGES.AUTH.TOKEN_MISSING))
    return
  }
  try {
    socket.data.user = await resolveAccessToken(token)
    next()
  } catch {
    next(new Error(MESSAGES.AUTH.TOKEN_INVALID))
  }
}
