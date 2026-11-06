import type { Request, Response } from 'express'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { UserNameParamsDto } from '../../../dtos/users/user/user-name-params.dto'
import * as followRequestService from '../../../services/users/follow-request/follow-request.service'
import { getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'
import { sendPage, sendSuccess } from '../../../utilities/responses/response.utility'

const userNameOf = (req: Request): string => getParams<UserNameParamsDto>(req).userName

export const listFollowRequests = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await followRequestService.listFollowRequests(getQuery<RelationQueryDto>(req), requireUser(req)))
}

export const acceptFollowRequest = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await followRequestService.acceptFollowRequest(userNameOf(req), requireUser(req)))
}

export const declineFollowRequest = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await followRequestService.declineFollowRequest(userNameOf(req), requireUser(req)))
}
