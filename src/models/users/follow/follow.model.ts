import { Schema, model } from 'mongoose'
import { FOLLOW_CODE_PREFIX } from '../../../constants/users/follow/follow.constants'
import type { Follow } from '../../../interfaces/models/users/follow/follow.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const followSchema = new Schema<Follow>({
  follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
})

followSchema.plugin(baseEntityPlugin, { codePrefix: FOLLOW_CODE_PREFIX })
// One relation per ordered pair, enforced by the database.
followSchema.index({ follower: 1, following: 1 }, { unique: true })
followSchema.index({ follower: 1, createdAt: -1 })

export const FollowModel = model<Follow>('Follow', followSchema)
