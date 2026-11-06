import { unlink } from 'fs/promises'
import type { NextFunction, Request, Response } from 'express'
import { MulterError } from 'multer'
import { Error as MongooseError } from 'mongoose'
import { MESSAGES } from '../../constants/common/messages.constants'
import { ERROR_STATUS } from '../../constants/common/http-status.constants'
import { ErrorCode } from '../../enums/common/error-code.enum'
import { AppError } from '../../utilities/errors/app-error.utility'
import { sendError } from '../../utilities/responses/response.utility'
import { logger } from '../../utilities/logging/logger.utility'

const MONGO_DUPLICATE_KEY = 11000

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === MONGO_DUPLICATE_KEY

const isJsonParseError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { type?: string }).type === 'entity.parse.failed'

/** Maps every known failure to one AppError so clients handle a single error shape. */
const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error
  if (error instanceof MulterError) {
    return error.code === 'LIMIT_FILE_SIZE'
      ? new AppError(ErrorCode.PAYLOAD_TOO_LARGE, MESSAGES.VIDEOS.FILE_TOO_LARGE)
      : new AppError(ErrorCode.VALIDATION_ERROR, error.message)
  }
  if (isDuplicateKeyError(error)) return new AppError(ErrorCode.CONFLICT, MESSAGES.COMMON.VALIDATION_FAILED)
  if (error instanceof MongooseError.CastError) return new AppError(ErrorCode.VALIDATION_ERROR, MESSAGES.VALIDATION.INVALID_ID)
  if (error instanceof MongooseError.ValidationError) {
    return new AppError(ErrorCode.VALIDATION_ERROR, MESSAGES.COMMON.VALIDATION_FAILED)
  }
  if (isJsonParseError(error)) return new AppError(ErrorCode.VALIDATION_ERROR, MESSAGES.COMMON.VALIDATION_FAILED)
  return new AppError(ErrorCode.INTERNAL_ERROR, MESSAGES.COMMON.INTERNAL_ERROR)
}

// Express recognises error handlers by their four parameters, so `_next` must stay.
export const errorHandler = async (error: unknown, req: Request, res: Response, _next: NextFunction): Promise<void> => {
  // An upload that failed later in the pipeline must not leave an orphaned file.
  if (req.file?.path) await unlink(req.file.path).catch(() => undefined)

  const appError = toAppError(error)
  if (appError.status >= ERROR_STATUS[ErrorCode.INTERNAL_ERROR]) {
    logger.error('Unhandled error', {
      requestId: req.requestId,
      error: error instanceof Error ? error.stack : String(error)
    })
  }
  sendError(res, appError.status, {
    code: appError.code,
    message: appError.message,
    details: appError.details,
    requestId: req.requestId
  })
}
