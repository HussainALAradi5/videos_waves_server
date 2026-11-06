import type { NextFunction, Request, Response } from 'express'
import { MESSAGES } from '../../constants/common/messages.constants'
import { resolveAccessToken } from '../../services/users/auth/session.service'
import { unauthorized } from '../../utilities/errors/app-error.utility'

const BEARER_PREFIX = 'Bearer '

const readBearerToken = (req: Request): string | null => {
  const header = req.header('Authorization')
  return header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : null
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = readBearerToken(req)
  if (!token) throw unauthorized(MESSAGES.AUTH.TOKEN_MISSING)
  req.user = await resolveAccessToken(token)
  next()
}

/** Public routes that personalise output (for example `isLiked`) when a valid token is sent. */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = readBearerToken(req)
  if (token) req.user = await resolveAccessToken(token)
  next()
}
