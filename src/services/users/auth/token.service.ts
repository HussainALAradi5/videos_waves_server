import jwt from 'jsonwebtoken'
import { jwtConfig } from '../../../config/auth/jwt.config'
import { TokenType } from '../../../enums/users/auth/token-type.enum'
import type { TokenPayload } from '../../../interfaces/auth/token-payload.interface'
import type { TokenSubject } from '../../../interfaces/auth/token-subject.interface'
import type { AuthTokensDto } from '../../../dtos/users/auth/auth-response.dto'

const secretFor = (type: TokenType): string =>
  type === TokenType.ACCESS ? jwtConfig.accessSecret : jwtConfig.refreshSecret

const sign = (subject: TokenSubject, type: TokenType): string => {
  const payload: TokenPayload = { sub: subject.id, role: subject.role, tokenVersion: subject.tokenVersion, type }
  const expiresIn = type === TokenType.ACCESS ? jwtConfig.accessExpiresIn : jwtConfig.refreshExpiresIn
  return jwt.sign(payload, secretFor(type), { expiresIn })
}

export const issueTokens = (subject: TokenSubject): AuthTokensDto => ({
  accessToken: sign(subject, TokenType.ACCESS),
  refreshToken: sign(subject, TokenType.REFRESH)
})

/** Returns the payload when the token is valid and of the expected type, otherwise null. */
export const verifyToken = (token: string, type: TokenType): TokenPayload | null => {
  try {
    const payload = jwt.verify(token, secretFor(type)) as TokenPayload
    return payload.type === type ? payload : null
  } catch {
    return null
  }
}
