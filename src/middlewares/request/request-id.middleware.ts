import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'

const HEADER = 'X-Request-Id'
const MAX_INCOMING_LENGTH = 100

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.header(HEADER)
  req.requestId = incoming && incoming.length <= MAX_INCOMING_LENGTH ? incoming : randomUUID()
  req.validated = {}
  res.setHeader(HEADER, req.requestId)
  next()
}
