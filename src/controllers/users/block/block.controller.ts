import type { Request, Response } from 'express'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { UserNameParamsDto } from '../../../dtos/users/user/user-name-params.dto'
import * as blockService from '../../../services/users/block/block.service'
import { sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

const userNameOf = (req: Request): string => getParams<UserNameParamsDto>(req).userName

export const blockUser = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await blockService.blockUser(userNameOf(req), requireUser(req)))
}

export const unblockUser = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await blockService.unblockUser(userNameOf(req), requireUser(req)))
}

export const listBlockedUsers = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await blockService.listBlockedUsers(getQuery<RelationQueryDto>(req), requireUser(req)))
}
