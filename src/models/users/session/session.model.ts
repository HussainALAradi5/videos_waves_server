import { Schema, model } from 'mongoose'
import { SESSION_CODE_PREFIX, SESSION_LIMITS } from '../../../constants/users/session/session.constants'
import type { Session } from '../../../interfaces/models/users/session/session.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const sessionSchema = new Schema<Session>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenId: { type: String, required: true, unique: true },
  previousTokenId: { type: String, default: null },
  rotatedAt: { type: Date, default: null },
  userAgent: { type: String, default: '', maxlength: SESSION_LIMITS.USER_AGENT_MAX },
  lastUsedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null }
})

sessionSchema.plugin(baseEntityPlugin, { codePrefix: SESSION_CODE_PREFIX })
sessionSchema.index({ user: 1, revokedAt: 1, lastUsedAt: -1 })
// MongoDB removes sessions a day after they expire.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })

export const SessionModel = model<Session>('Session', sessionSchema)
