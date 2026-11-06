import type { NextFunction, Request, Response } from 'express'
import { MESSAGES } from '../../constants/common/messages.constants'
import type { Role } from '../../enums/users/roles/role.enum'
import { forbidden } from '../../utilities/errors/app-error.utility'
import { requireUser } from '../../utilities/requests/request.utility'

/** Allows the request when the authenticated user has any of the given roles. */
export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const user = requireUser(req)
    if (!roles.includes(user.role)) throw forbidden(MESSAGES.AUTH.FORBIDDEN)
    next()
  }
