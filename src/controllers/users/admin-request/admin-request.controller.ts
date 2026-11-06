import type { Request, Response } from 'express'
import type { CreateAdminRequestDto } from '../../../dtos/users/admin-request/create-admin-request.dto'
import type { DecideAdminRequestDto } from '../../../dtos/users/admin-request/decide-admin-request.dto'
import type { AdminRequestQueryDto } from '../../../dtos/users/admin-request/admin-request-query.dto'
import type { AdminRequestParamsDto } from '../../../dtos/users/admin-request/admin-request-params.dto'
import * as adminRequestService from '../../../services/users/admin-request/admin-request.service'
import { sendCreated, sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

const requestIdOf = (req: Request): string => getParams<AdminRequestParamsDto>(req).requestId

export const createRequest = async (req: Request, res: Response): Promise<void> => {
  sendCreated(res, await adminRequestService.createAdminRequest(getBody<CreateAdminRequestDto>(req), requireUser(req)))
}

export const listRequests = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await adminRequestService.listAdminRequests(getQuery<AdminRequestQueryDto>(req), requireUser(req)))
}

export const getRequest = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await adminRequestService.getAdminRequest(requestIdOf(req), requireUser(req)))
}

export const decideRequest = async (req: Request, res: Response): Promise<void> => {
  const dto = getBody<DecideAdminRequestDto>(req)
  sendSuccess(res, await adminRequestService.decideAdminRequest(requestIdOf(req), dto, requireUser(req)))
}

export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await adminRequestService.cancelAdminRequest(requestIdOf(req), requireUser(req)))
}
