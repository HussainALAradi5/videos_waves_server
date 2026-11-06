import { Schema, model } from 'mongoose'
import { FOLLOW_REQUEST_CODE_PREFIX } from '../../../constants/users/follow-request/follow-request.constants'
import type { FollowRequest } from '../../../interfaces/models/users/follow-request/follow-request.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const followRequestSchema = new Schema<FollowRequest>({
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  target: { type: Schema.Types.ObjectId, ref: 'User', required: true }
})

followRequestSchema.plugin(baseEntityPlugin, { codePrefix: FOLLOW_REQUEST_CODE_PREFIX })
// One pending request per ordered pair; the owner's list is newest first.
followRequestSchema.index({ requester: 1, target: 1 }, { unique: true })
followRequestSchema.index({ target: 1, createdAt: -1 })

export const FollowRequestModel = model<FollowRequest>('FollowRequest', followRequestSchema)
