import type { Types } from 'mongoose'
import type { AdminRequestStatus } from '../../../../enums/users/admin-request/admin-request-status.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface AdminRequest extends BaseEntity {
  requester: Types.ObjectId
  reason: string
  status: AdminRequestStatus
  decidedBy: Types.ObjectId | null
  decidedAt: Date | null
  decisionNote: string | null
}
