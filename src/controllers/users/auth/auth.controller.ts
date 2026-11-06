import type { Request, Response } from 'express'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { RegisterDto } from '../../../dtos/users/auth/register.dto'
import type { LoginDto } from '../../../dtos/users/auth/login.dto'
import type { RefreshTokenDto } from '../../../dtos/users/auth/refresh-token.dto'
import * as authService from '../../../services/users/auth/auth.service'
import { sendCreated, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, requireUser } from '../../../utilities/requests/request.utility'

export const register = async (req: Request, res: Response): Promise<void> => {
  sendCreated(res, await authService.register(getBody<RegisterDto>(req)))
}

export const login = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await authService.login(getBody<LoginDto>(req)))
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await authService.refresh(getBody<RefreshTokenDto>(req)))
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  await authService.logout(requireUser(req).id)
  sendSuccess(res, { message: MESSAGES.AUTH.LOGGED_OUT })
}
