import type { Request, Response } from 'express'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { UserNameParamsDto } from '../../../dtos/users/user/user-name-params.dto'
import * as restrictionService from '../../../services/users/restriction/restriction.service'
import { sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

const userNameOf = (req: Request): string => getParams<UserNameParamsDto>(req).userName

export const restrictUser = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await restrictionService.restrictUser(userNameOf(req), requireUser(req)))
}

export const unrestrictUser = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await restrictionService.unrestrictUser(userNameOf(req), requireUser(req)))
}

export const listRestrictedUsers = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await restrictionService.listRestrictedUsers(getQuery<RelationQueryDto>(req), requireUser(req)))
}
