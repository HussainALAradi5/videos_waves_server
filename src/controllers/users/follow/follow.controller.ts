import type { Request, Response } from 'express'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { UserNameParamsDto } from '../../../dtos/users/user/user-name-params.dto'
import * as followService from '../../../services/users/follow/follow.service'
import { sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

const userNameOf = (req: Request): string => getParams<UserNameParamsDto>(req).userName

export const followUser = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await followService.followUser(userNameOf(req), requireUser(req)))
}

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await followService.unfollowUser(userNameOf(req), requireUser(req)))
}

export const listFollowers = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await followService.listFollows('followers', userNameOf(req), getQuery<RelationQueryDto>(req), req.user?.id))
}

export const listFollowing = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await followService.listFollows('following', userNameOf(req), getQuery<RelationQueryDto>(req), req.user?.id))
}
