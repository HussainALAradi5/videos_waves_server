import type { NextFunction, Request, Response } from 'express'
import { MESSAGES } from '../../constants/common/messages.constants'
import { TokenType } from '../../enums/users/auth/token-type.enum'
import { verifyToken } from '../../services/users/auth/token.service'
import { userRepository } from '../../repositories/users/user/user.repository'
import { unauthorized } from '../../utilities/errors/app-error.utility'

const BEARER_PREFIX = 'Bearer '

const readBearerToken = (req: Request): string | null => {
  const header = req.header('Authorization')
  return header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : null
}

/**
 * Verifies the access token and reloads role and token version from the database,
 * so deactivated users, revoked sessions, and role changes take effect immediately.
 */
const attachUser = async (req: Request, token: string): Promise<void> => {
  const payload = verifyToken(token, TokenType.ACCESS)
  const state = payload ? await userRepository.findAuthState(payload.sub) : null
  if (!payload || !state || state.tokenVersion !== payload.tokenVersion) {
    throw unauthorized(MESSAGES.AUTH.TOKEN_INVALID)
  }
  req.user = { id: payload.sub, role: state.role }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = readBearerToken(req)
  if (!token) throw unauthorized(MESSAGES.AUTH.TOKEN_MISSING)
  await attachUser(req, token)
  next()
}

/** Public routes that personalise output (for example `isLiked`) when a valid token is sent. */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = readBearerToken(req)
  if (token) await attachUser(req, token)
  next()
}
