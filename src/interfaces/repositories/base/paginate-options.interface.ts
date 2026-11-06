import type { PopulateOptions } from 'mongoose'

export interface PaginateOptions {
  projection?: string
  populate?: PopulateOptions | PopulateOptions[]
}
