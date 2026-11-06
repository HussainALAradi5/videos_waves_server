import type { BaseEntityResponseDto } from '../../common/base/base-entity-response.dto'

/** One signed-in device, for "Where you are signed in". */
export interface SessionResponseDto extends BaseEntityResponseDto {
  userAgent: string
  lastUsedAt: string
  isCurrent: boolean
}
