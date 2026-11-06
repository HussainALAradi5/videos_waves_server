import type { Request, Response } from 'express'
import type { UpdateAccountStatusDto } from '../../../dtos/users/account-status/update-account-status.dto'
import type { UserNameParamsDto } from '../../../dtos/users/user/user-name-params.dto'
import * as accountStatusService from '../../../services/users/account-status/account-status.service'
import { sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, requireUser } from '../../../utilities/requests/request.utility'

export const setAccountStatus = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(
    res,
    await accountStatusService.setAccountActive(
      getParams<UserNameParamsDto>(req).userName,
      getBody<UpdateAccountStatusDto>(req),
      requireUser(req)
    )
  )
}
