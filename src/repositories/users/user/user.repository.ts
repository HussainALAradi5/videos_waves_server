import type { QueryFilter } from 'mongoose'
import { UserModel } from '../../../models/users/user/user.model'
import type { User } from '../../../interfaces/models/users/user/user.interface'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId, toOptionalObjectId } from '../../../utilities/ids/object-id.utility'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import { isPhone, normalizePhone } from '../../../utilities/users/contact.utility'

const SECRET_FIELDS = '+passwordHash +tokenVersion'

class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel)
  }

  /**
   * Sign-in by email (has `@`), mobile number (any common format, stored as E.164), or username.
   * A phone-shaped value also matches a username, since an all-digit username is allowed.
   */
  findByLogin(identifier: string) {
    const normalized = identifier.trim()
    const filter: QueryFilter<User> = normalized.includes('@')
      ? { email: normalized.toLowerCase() }
      : isPhone(normalized)
        ? { $or: [{ phone: normalizePhone(normalized) }, { userName: normalized }] }
        : { userName: normalized }
    return this.model.findOne(this.active(filter)).select(SECRET_FIELDS)
  }

  findByUserName(userName: string) {
    return this.model.findOne(this.active({ userName }))
  }

  /** Public fields of many active users in one query. */
  findPublicByIds(ids: string[]) {
    return this.model.find(this.active({ _id: { $in: ids.map(toObjectId) } }), USER_PUBLIC_FIELDS).lean()
  }

  async findIdsByUserName(pattern: RegExp): Promise<string[]> {
    const rows = await this.model.find(this.active({ userName: pattern }), '_id').lean()
    return rows.map((row) => row._id.toString())
  }

  /** Active users by name, in one query. */
  findByUserNames(userNames: string[]) {
    return this.model.find(this.active({ userName: { $in: userNames } }))
  }

  findByIdWithSecrets(id: string) {
    return this.findById(id).select(SECRET_FIELDS)
  }

  findAuthState(id: string) {
    // A deactivated account has no usable auth state, so its tokens stop working at once.
    return this.model.findOne(this.active({ _id: toObjectId(id), deactivatedAt: null }), 'role +tokenVersion').lean()
  }

  async isEmailTaken(email: string, exceptId?: string): Promise<boolean> {
    return this.isTaken({ email: email.toLowerCase() }, exceptId)
  }

  async isPhoneTaken(phone: string, exceptId?: string): Promise<boolean> {
    return this.isTaken({ phone }, exceptId)
  }

  async isUserNameTaken(userName: string, exceptId?: string): Promise<boolean> {
    return this.isTaken({ userName }, exceptId)
  }

  /** Includes deactivated accounts; the demo seed uses it to bring demo accounts back. */
  async findIdByEmailIncludingDeleted(email: string): Promise<string | null> {
    const user = await this.model.findOne({ email: email.toLowerCase() }, '_id').lean()
    return user ? user._id.toString() : null
  }

  findForExport(filter: QueryFilter<User>, limit: number) {
    return this.model.find(this.active(filter)).sort({ createdAt: -1, _id: -1 }).limit(limit).lean()
  }

  async findDeactivatedIds(): Promise<string[]> {
    const users = await this.model.find(this.active({ deactivatedAt: { $ne: null } }), '_id').lean()
    return users.map((user) => user._id.toString())
  }

  async isDeactivated(id: string): Promise<boolean> {
    return (await this.model.exists({ _id: toObjectId(id), deactivatedAt: { $ne: null } })) !== null
  }

  async setDeactivated(id: string, isDeactivated: boolean, actorId: string | null): Promise<void> {
    const deactivatedAt = isDeactivated ? new Date() : null
    const deactivatedBy = isDeactivated ? toOptionalObjectId(actorId) : null
    await this.updateById(id, { $set: { deactivatedAt, deactivatedBy } }, actorId)
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await this.model.updateOne({ _id: toObjectId(id) }, { $inc: { tokenVersion: 1 } })
  }

  // Uniqueness checks include soft-deleted users so their unique keys are never reused.
  private async isTaken(filter: QueryFilter<User>, exceptId?: string): Promise<boolean> {
    const scoped = exceptId ? { ...filter, _id: { $ne: toObjectId(exceptId) } } : filter
    return (await this.model.exists(scoped)) !== null
  }
}

export const userRepository = new UserRepository()
