import type { Request, Response } from 'express'
import { MESSAGES } from '../../constants/common/messages.constants'
import { notFound } from '../../utilities/errors/app-error.utility'

export const notFoundHandler = (_req: Request, _res: Response): never => {
  throw notFound(MESSAGES.COMMON.ROUTE_NOT_FOUND)
}
