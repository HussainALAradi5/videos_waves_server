import type { Request, Response } from 'express'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { UpdateProfileDto } from '../../../dtos/users/user/update-profile.dto'
import type { ChangePasswordDto } from '../../../dtos/users/user/change-password.dto'
import type { UserQueryDto } from '../../../dtos/users/user/user-query.dto'
import type { UpdateAvatarDto } from '../../../dtos/users/user/update-avatar.dto'
import * as userService from '../../../services/users/user/user.service'
import { sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getQuery, requireUser } from '../../../utilities/requests/request.utility'

export const getMe = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await userService.getProfile(requireUser(req).id))
}

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await userService.updateProfile(requireUser(req).id, getBody<UpdateProfileDto>(req)))
}

export const updateMyAvatar = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await userService.updateAvatar(getBody<UpdateAvatarDto>(req), requireUser(req)))
}

export const changeMyPassword = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await userService.changePassword(requireUser(req).id, getBody<ChangePasswordDto>(req)))
}

export const deactivateMe = async (req: Request, res: Response): Promise<void> => {
  await userService.deactivateAccount(requireUser(req).id)
  sendSuccess(res, { message: MESSAGES.USERS.DEACTIVATED })
}

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await userService.listUsers(getQuery<UserQueryDto>(req)))
}
