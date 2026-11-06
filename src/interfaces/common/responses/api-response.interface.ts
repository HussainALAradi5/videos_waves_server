import type { ErrorCode } from '../../../enums/common/error-code.enum'
import type { PageMeta } from '../pagination/page-meta.interface'
import type { CursorMeta } from '../pagination/cursor-meta.interface'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: PageMeta | CursorMeta
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
