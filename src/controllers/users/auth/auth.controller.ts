import type { Request, Response } from 'express'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { RegisterDto } from '../../../dtos/users/auth/register.dto'
import type { LoginDto } from '../../../dtos/users/auth/login.dto'
import type { RefreshTokenDto } from '../../../dtos/users/auth/refresh-token.dto'
import type { SessionParamsDto } from '../../../dtos/users/session/session-params.dto'
import * as authService from '../../../services/users/auth/auth.service'
import * as sessionService from '../../../services/users/auth/session.service'
import { sendCreated, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, requireUser, userAgentOf } from '../../../utilities/requests/request.utility'

export const register = async (req: Request, res: Response): Promise<void> => {
  sendCreated(res, await authService.register(getBody<RegisterDto>(req), userAgentOf(req)))
}

export const login = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await authService.login(getBody<LoginDto>(req), userAgentOf(req)))
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await sessionService.refreshSession(getBody<RefreshTokenDto>(req).refreshToken))
}

/** Signs out this device only. */
export const logout = async (req: Request, res: Response): Promise<void> => {
  const actor = requireUser(req)
  await sessionService.revokeSession(actor.sessionId, actor)
  sendSuccess(res, { message: MESSAGES.AUTH.LOGGED_OUT })
}

export const logoutEverywhere = async (req: Request, res: Response): Promise<void> => {
  await sessionService.revokeAllSessions(requireUser(req).id)
  sendSuccess(res, { message: MESSAGES.AUTH.LOGGED_OUT_EVERYWHERE })
}

export const listSessions = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await sessionService.listSessions(requireUser(req)))
}

export const revokeSession = async (req: Request, res: Response): Promise<void> => {
  await sessionService.revokeSession(getParams<SessionParamsDto>(req).sessionId, requireUser(req))
  sendSuccess(res, { message: MESSAGES.AUTH.LOGGED_OUT })
}
