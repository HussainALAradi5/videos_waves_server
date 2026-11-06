import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { MESSAGES } from '../../constants/common/messages.constants'
import type { RequestSchemas } from '../../interfaces/common/requests/request-schemas.interface'
import { badRequest } from '../../utilities/errors/app-error.utility'

const parsePart = (schema: ZodType | undefined, value: unknown, part: string): unknown => {
  if (!schema) return undefined
  const result = schema.safeParse(value ?? {})
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: [part, ...issue.path].join('.'),
      message: issue.message
    }))
    throw badRequest(MESSAGES.COMMON.VALIDATION_FAILED, details)
  }
  return result.data
}

/** Parses body, query, and params with their DTO schemas and stores the typed result on `req.validated`. */
export const validate =
  (schemas: RequestSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    req.validated = {
      body: parsePart(schemas.body, req.body, 'body'),
      query: parsePart(schemas.query, req.query, 'query'),
      params: parsePart(schemas.params, req.params, 'params')
    }
    next()
  }
