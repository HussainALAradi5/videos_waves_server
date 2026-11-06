import { Schema, model } from 'mongoose'
import { RESTRICTION_CODE_PREFIX } from '../../../constants/users/restriction/restriction.constants'
import type { Restriction } from '../../../interfaces/models/users/restriction/restriction.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const restrictionSchema = new Schema<Restriction>({
  restricter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restricted: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
})

restrictionSchema.plugin(baseEntityPlugin, { codePrefix: RESTRICTION_CODE_PREFIX })
// One relation per ordered pair, enforced by the database.
restrictionSchema.index({ restricter: 1, restricted: 1 }, { unique: true })
restrictionSchema.index({ restricter: 1, createdAt: -1 })

export const RestrictionModel = model<Restriction>('Restriction', restrictionSchema)
