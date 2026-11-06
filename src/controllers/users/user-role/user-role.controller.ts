import type { Request, Response } from 'express'
import type { UpdateUserRoleDto } from '../../../dtos/users/user-role/update-user-role.dto'
import type { UserNameParamsDto } from '../../../dtos/users/user/user-name-params.dto'
import * as userRoleService from '../../../services/users/user-role/user-role.service'
import { getBody, getParams, requireUser } from '../../../utilities/requests/request.utility'
import { sendSuccess } from '../../../utilities/responses/response.utility'

export const setUserRole = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await userRoleService.setUserRole(getParams<UserNameParamsDto>(req).userName, getBody<UpdateUserRoleDto>(req), requireUser(req)))
}
