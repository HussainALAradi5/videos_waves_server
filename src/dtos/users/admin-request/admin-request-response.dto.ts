import type { BaseEntityResponseDto } from '../../common/base/base-entity-response.dto'
import type { AdminRequestStatus } from '../../../enums/users/admin-request/admin-request-status.enum'
import type { PublicUserResponseDto } from '../user/public-user-response.dto'

export interface AdminRequestResponseDto extends BaseEntityResponseDto {
  reason: string
  status: AdminRequestStatus
  requester: PublicUserResponseDto
  decidedBy: string | null
  decidedAt: string | null
  decisionNote: string | null
}
