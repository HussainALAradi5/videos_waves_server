import type { ZodType } from 'zod'

export interface RequestSchemas {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}
