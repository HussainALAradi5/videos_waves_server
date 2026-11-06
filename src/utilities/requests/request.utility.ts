import type { Request } from 'express'
import { MESSAGES } from '../../constants/common/messages.constants'
import type { AuthUser } from '../../interfaces/users/auth/auth-user.interface'
import { unauthorized } from '../errors/app-error.utility'

// Typed readers for data that the validate middleware already parsed.
export const getBody = <T>(req: Request): T => req.validated.body as T
export const getQuery = <T>(req: Request): T => req.validated.query as T
export const getParams = <T>(req: Request): T => req.validated.params as T

/** The client's user agent, used to label its session ("Chrome on Windows"). */
export const userAgentOf = (req: Request): string => req.get('user-agent') ?? ''

export const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw unauthorized(MESSAGES.AUTH.TOKEN_MISSING)
  return req.user
}
