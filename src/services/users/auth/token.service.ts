import jwt from 'jsonwebtoken'
import { jwtConfig } from '../../../config/auth/jwt.config'
import { TokenType } from '../../../enums/users/auth/token-type.enum'
import type { AuthTokensDto } from '../../../dtos/users/auth/auth-response.dto'
import type { TokenPayload } from '../../../interfaces/users/auth/token-payload.interface'
import type { TokenSubject } from '../../../interfaces/users/auth/token-subject.interface'

const secretFor = (type: TokenType): string =>
  type === TokenType.ACCESS ? jwtConfig.accessSecret : jwtConfig.refreshSecret

const sign = (subject: TokenSubject, type: TokenType, tokenId?: string): string => {
  const payload: TokenPayload = {
    sub: subject.id,
    role: subject.role,
    tokenVersion: subject.tokenVersion,
    type,
    sid: subject.sessionId,
    ...(tokenId ? { jti: tokenId } : {})
  }
  const expiresIn = type === TokenType.ACCESS ? jwtConfig.accessExpiresIn : jwtConfig.refreshExpiresIn
  return jwt.sign(payload, secretFor(type), { expiresIn })
}

/** A short-lived access token and a refresh token identified by `refreshTokenId`. */
export const issueTokens = (subject: TokenSubject, refreshTokenId: string): AuthTokensDto => ({
  accessToken: sign(subject, TokenType.ACCESS),
  refreshToken: sign(subject, TokenType.REFRESH, refreshTokenId)
})

/** When a refresh token issued now would expire, read from a signed token so it always matches the config. */
export const refreshExpiryFromNow = (): Date => {
  const probe = jwt.decode(jwt.sign({}, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn })) as {
    exp: number
  }
  return new Date(probe.exp * 1000)
}

/** Returns the payload when the token is valid, of the expected type, and tied to a session; otherwise null. */
export const verifyToken = (token: string, type: TokenType): TokenPayload | null => {
  try {
    const payload = jwt.verify(token, secretFor(type)) as TokenPayload
    return payload.type === type && typeof payload.sid === 'string' ? payload : null
  } catch {
    return null
  }
}
