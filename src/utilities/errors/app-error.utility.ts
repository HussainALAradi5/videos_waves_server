import { ErrorCode } from '../../enums/common/error-code.enum'
import { ERROR_STATUS } from '../../constants/common/http-status.constants'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = ERROR_STATUS[code]
    this.details = details
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(ErrorCode.VALIDATION_ERROR, message, details)
export const unauthorized = (message: string): AppError => new AppError(ErrorCode.UNAUTHORIZED, message)
export const forbidden = (message: string): AppError => new AppError(ErrorCode.FORBIDDEN, message)
export const notFound = (message: string): AppError => new AppError(ErrorCode.NOT_FOUND, message)
export const conflict = (message: string): AppError => new AppError(ErrorCode.CONFLICT, message)
