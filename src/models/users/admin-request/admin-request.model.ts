import { Schema, model } from 'mongoose'
import { AdminRequestStatus } from '../../../enums/users/admin-request/admin-request-status.enum'
import {
  ADMIN_REQUEST_CODE_PREFIX,
  ADMIN_REQUEST_LIMITS
} from '../../../constants/users/admin-request/admin-request.constants'
import type { AdminRequest } from '../../../interfaces/models/users/admin-request/admin-request.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const adminRequestSchema = new Schema<AdminRequest>({
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, trim: true, maxlength: ADMIN_REQUEST_LIMITS.REASON_MAX },
  status: {
    type: String,
    enum: Object.values(AdminRequestStatus),
    default: AdminRequestStatus.PENDING
  },
  decidedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  decidedAt: { type: Date, default: null },
  decisionNote: { type: String, default: null, maxlength: ADMIN_REQUEST_LIMITS.NOTE_MAX }
})

adminRequestSchema.plugin(baseEntityPlugin, { codePrefix: ADMIN_REQUEST_CODE_PREFIX })
adminRequestSchema.index({ requester: 1, createdAt: -1 })
adminRequestSchema.index({ status: 1, createdAt: -1 })
// Database-level guarantee: a user can hold at most one pending request.
adminRequestSchema.index(
  { requester: 1 },
  {
    unique: true,
    partialFilterExpression: { status: AdminRequestStatus.PENDING },
    name: 'one_pending_request_per_user'
  }
)

export const AdminRequestModel = model<AdminRequest>('AdminRequest', adminRequestSchema)
