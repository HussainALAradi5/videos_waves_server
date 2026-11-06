import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

/** One signed-in device. Its refresh token rotates on every use; reusing an old one revokes it. */
export interface Session extends BaseEntity {
  user: Types.ObjectId
  /** `jti` of the only refresh token that may be used next. */
  tokenId: string
  /** The token it replaced, accepted during the rotation grace window. */
  previousTokenId: string | null
  rotatedAt: Date | null
  userAgent: string
  lastUsedAt: Date
  expiresAt: Date
  revokedAt: Date | null
}
