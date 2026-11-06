import { randomUUID } from 'crypto'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { SESSION_LIMITS } from '../../../constants/users/session/session.constants'
import { TokenType } from '../../../enums/users/auth/token-type.enum'
import type { AuthTokensDto } from '../../../dtos/users/auth/auth-response.dto'
import type { SessionResponseDto } from '../../../dtos/users/session/session-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { User } from '../../../interfaces/models/users/user/user.interface'
import { sessionRepository } from '../../../repositories/users/session/session.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { notFound, unauthorized } from '../../../utilities/errors/app-error.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { disconnectSessions } from '../../chat/realtime/chat-events.service'
import { issueTokens, refreshExpiryFromNow, verifyToken } from './token.service'

/**
 * Verifies an access token and reloads role, token version, and the session from the database, so
 * deactivated users, revoked devices, and role changes take effect immediately. Shared by HTTP and sockets.
 */
export const resolveAccessToken = async (token: string): Promise<AuthUser> => {
  const payload = verifyToken(token, TokenType.ACCESS)
  const state = payload ? await userRepository.findAuthState(payload.sub) : null
  const isValid = payload && state && state.tokenVersion === payload.tokenVersion
  if (!isValid || !(await sessionRepository.isUsable(payload.sid))) throw unauthorized(MESSAGES.AUTH.TOKEN_INVALID)
  return { id: payload.sub, role: state.role, sessionId: payload.sid }
}

/** Signs a user in on one device: a new session with its first refresh token. */
export const startSession = async (user: User, userAgent: string): Promise<AuthTokensDto> => {
  const tokenId = randomUUID()
  const userId = user._id.toString()
  const session = await sessionRepository.create(
    {
      user: toObjectId(userId),
      tokenId,
      userAgent: userAgent.slice(0, SESSION_LIMITS.USER_AGENT_MAX),
      lastUsedAt: new Date(),
      expiresAt: refreshExpiryFromNow()
    },
    userId
  )
  const subject = { id: userId, role: user.role, tokenVersion: user.tokenVersion, sessionId: session._id.toString() }
  return issueTokens(subject, tokenId)
}

const isWithinGrace = (rotatedAt: Date | null): boolean =>
  rotatedAt !== null && Date.now() - rotatedAt.getTime() <= SESSION_LIMITS.ROTATION_GRACE_MS

/**
 * Exchanges a refresh token for new tokens and rotates it. Presenting an older token (outside the
 * short grace window for simultaneous refreshes) means it was copied, so the session is revoked.
 */
export const refreshSession = async (refreshToken: string): Promise<AuthTokensDto> => {
  const payload = verifyToken(refreshToken, TokenType.REFRESH)
  const session = payload?.jti ? await sessionRepository.findUsable(payload.sid) : null
  const state = payload ? await userRepository.findAuthState(payload.sub) : null
  if (!payload?.jti || !session || !state || state.tokenVersion !== payload.tokenVersion) {
    throw unauthorized(MESSAGES.AUTH.REFRESH_INVALID)
  }
  const subject = { id: payload.sub, role: state.role, tokenVersion: state.tokenVersion, sessionId: payload.sid }
  if (payload.jti === session.previousTokenId && isWithinGrace(session.rotatedAt)) {
    return issueTokens(subject, session.tokenId)
  }
  if (payload.jti !== session.tokenId) {
    await sessionRepository.revoke(payload.sid, payload.sub)
    disconnectSessions(payload.sub, [payload.sid])
    throw unauthorized(MESSAGES.AUTH.REFRESH_REUSED)
  }
  const nextTokenId = randomUUID()
  if (await sessionRepository.rotate(payload.sid, payload.jti, nextTokenId)) return issueTokens(subject, nextTokenId)
  // Another tab rotated this token a moment ago: share its result instead of forking the session.
  const rotated = await sessionRepository.findUsable(payload.sid)
  if (rotated?.previousTokenId === payload.jti) return issueTokens(subject, rotated.tokenId)
  throw unauthorized(MESSAGES.AUTH.REFRESH_INVALID)
}

export const listSessions = async (actor: AuthUser): Promise<SessionResponseDto[]> =>
  (await sessionRepository.listUsable(actor.id)).map((session) => ({
    id: session._id.toString(),
    code: session.code,
    createdAt: session.createdAt.toISOString(),
    userAgent: session.userAgent,
    lastUsedAt: session.lastUsedAt.toISOString(),
    isCurrent: session._id.toString() === actor.sessionId
  }))

/** Signs one device out; its access token stops working at once and its sockets close. */
export const revokeSession = async (sessionId: string, actor: AuthUser): Promise<void> => {
  if (!(await sessionRepository.revoke(sessionId, actor.id))) throw notFound(MESSAGES.AUTH.SESSION_NOT_FOUND)
  disconnectSessions(actor.id, [sessionId])
}

/** Signs every device out (also used after a password change or deactivation). */
export const revokeAllSessions = async (userId: string): Promise<void> => {
  await userRepository.incrementTokenVersion(userId)
  await sessionRepository.revokeAll(userId)
  disconnectSessions(userId)
}
