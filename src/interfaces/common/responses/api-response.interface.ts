import type { ErrorCode } from '../../../enums/common/error-code.enum'
import type { PageMeta } from '../pagination/page-meta.interface'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: PageMeta
}

export interface ApiErrorBody {
  code: ErrorCode
  message: string
  details?: unknown
  requestId?: string
}

export interface ApiFailure {
  success: false
  error: ApiErrorBody
}
