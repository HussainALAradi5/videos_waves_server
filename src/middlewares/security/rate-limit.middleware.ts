import rateLimit from 'express-rate-limit'
import type { Request, Response } from 'express'
import { rateLimitConfig } from '../../config/security/rate-limit.config'
import { MESSAGES } from '../../constants/common/messages.constants'
import { ERROR_STATUS } from '../../constants/common/http-status.constants'
import { ErrorCode } from '../../enums/common/error-code.enum'
import { sendError } from '../../utilities/responses/response.utility'

const rejectRequest = (req: Request, res: Response): void =>
  sendError(res, ERROR_STATUS[ErrorCode.TOO_MANY_REQUESTS], {
    code: ErrorCode.TOO_MANY_REQUESTS,
    message: MESSAGES.COMMON.TOO_MANY_REQUESTS,
    requestId: req.requestId
  })

const buildLimiter = (options: { windowMs: number; limit: number }) =>
  rateLimit({ ...options, standardHeaders: 'draft-8', legacyHeaders: false, handler: rejectRequest })

export const generalRateLimit = buildLimiter(rateLimitConfig.general)
export const authRateLimit = buildLimiter(rateLimitConfig.auth)
export const uploadRateLimit = buildLimiter(rateLimitConfig.upload)
