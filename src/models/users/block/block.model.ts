import { Schema, model } from 'mongoose'
import { BLOCK_CODE_PREFIX } from '../../../constants/users/block/block.constants'
import type { Block } from '../../../interfaces/models/users/block/block.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const blockSchema = new Schema<Block>({
  blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
})

blockSchema.plugin(baseEntityPlugin, { codePrefix: BLOCK_CODE_PREFIX })
// One relation per ordered pair, enforced by the database.
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true })
blockSchema.index({ blocker: 1, createdAt: -1 })

export const BlockModel = model<Block>('Block', blockSchema)
