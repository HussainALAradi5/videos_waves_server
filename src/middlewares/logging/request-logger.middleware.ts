import type { NextFunction, Request, Response } from 'express'
import { logger } from '../../utilities/logging/logger.utility'

/** Logs method, path, status, and duration only: never bodies, tokens, or passwords. */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = process.hrtime.bigint()
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    logger.info('request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs)
    })
  })
  next()
}
