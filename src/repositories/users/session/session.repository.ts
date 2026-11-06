import type { Session } from '../../../interfaces/models/users/session/session.interface'
import { SessionModel } from '../../../models/users/session/session.model'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super(SessionModel)
  }

  /** A session that can still be used: not revoked and not expired. */
  findUsable(sessionId: string) {
    return this.model.findOne(
      this.active({ _id: toObjectId(sessionId), revokedAt: null, expiresAt: { $gt: new Date() } })
    )
  }

  async isUsable(sessionId: string): Promise<boolean> {
    return (await this.findUsable(sessionId)) !== null
  }

  listUsable(userId: string) {
    return this.model
      .find(this.active({ user: toObjectId(userId), revokedAt: null, expiresAt: { $gt: new Date() } }))
      .sort({ lastUsedAt: -1 })
      .lean()
  }

  /**
   * Atomically swaps in a new refresh token id, remembering the old one for the grace window.
   * Returns false when another request rotated it first.
   */
  async rotate(sessionId: string, previousTokenId: string, nextTokenId: string): Promise<boolean> {
    const now = new Date()
    const result = await this.model.updateOne(
      { _id: toObjectId(sessionId), tokenId: previousTokenId },
      { $set: { tokenId: nextTokenId, previousTokenId, rotatedAt: now, lastUsedAt: now } }
    )
    return result.modifiedCount === 1
  }

  async revoke(sessionId: string, userId: string): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: toObjectId(sessionId), user: toObjectId(userId), revokedAt: null },
      { $set: { revokedAt: new Date() } }
    )
    return result.modifiedCount === 1
  }

  async revokeAll(userId: string): Promise<void> {
    await this.model.updateMany({ user: toObjectId(userId), revokedAt: null }, { $set: { revokedAt: new Date() } })
  }
}

export const sessionRepository = new SessionRepository()
