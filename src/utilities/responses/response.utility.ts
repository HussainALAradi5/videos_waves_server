import type { Response } from 'express'
import { HTTP_STATUS } from '../../constants/common/http-status.constants'
import type { ApiFailure, ApiErrorBody, ApiSuccess } from '../../interfaces/common/responses/api-response.interface'
import type { PageResult } from '../../interfaces/common/pagination/page-result.interface'
import type { CursorPage } from '../../interfaces/common/pagination/cursor-page.interface'

export const sendSuccess = <T>(res: Response, data: T, status: number = HTTP_STATUS.OK): void => {
  const body: ApiSuccess<T> = { success: true, data }
  res.status(status).json(body)
}

export const sendCreated = <T>(res: Response, data: T): void => sendSuccess(res, data, HTTP_STATUS.CREATED)

export const sendPage = <T>(res: Response, page: PageResult<T>): void => {
  const body: ApiSuccess<T[]> = { success: true, data: page.items, meta: page.meta }
  res.status(HTTP_STATUS.OK).json(body)
}

export const sendCursorPage = <T>(res: Response, page: CursorPage<T>): void => {
  const body: ApiSuccess<T[]> = { success: true, data: page.items, meta: page.meta }
  res.status(HTTP_STATUS.OK).json(body)
}

export const sendError = (res: Response, status: number, error: ApiErrorBody): void => {
  const body: ApiFailure = { success: false, error }
  res.status(status).json(body)
}
