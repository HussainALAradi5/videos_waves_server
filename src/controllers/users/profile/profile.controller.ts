import type { Request, Response } from 'express'
import type { UserNameParamsDto } from '../../../dtos/users/user/user-name-params.dto'
import type { UserSearchQueryDto } from '../../../dtos/users/user/user-search-query.dto'
import * as profileService from '../../../services/users/profile/profile.service'
import * as userService from '../../../services/users/user/user.service'
import { sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getParams, getQuery } from '../../../utilities/requests/request.utility'

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await profileService.getProfile(getParams<UserNameParamsDto>(req).userName, req.user?.id, req.user?.role))
}

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await userService.searchUsers(getQuery<UserSearchQueryDto>(req), req.user?.id))
}
