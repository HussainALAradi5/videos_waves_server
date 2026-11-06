import type { Request, Response } from 'express'
import { USER_EXPORT_FILE_NAME } from '../../../constants/users/user/user-transfer.constants'
import type { ImportUsersDto } from '../../../dtos/users/user/import-users.dto'
import type { UserQueryDto } from '../../../dtos/users/user/user-query.dto'
import * as userTransferService from '../../../services/users/user-transfer/user-transfer.service'
import { getBody, getQuery, requireUser } from '../../../utilities/requests/request.utility'
import { sendSuccess } from '../../../utilities/responses/response.utility'

export const exportUsers = async (req: Request, res: Response): Promise<void> => {
  const csv = await userTransferService.exportUsers(getQuery<UserQueryDto>(req))
  res.attachment(USER_EXPORT_FILE_NAME).type('text/csv; charset=utf-8').send(csv)
}

export const importUsers = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await userTransferService.importUsers(getBody<ImportUsersDto>(req), requireUser(req)))
}
