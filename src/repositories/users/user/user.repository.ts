import type { QueryFilter } from 'mongoose'
import { UserModel } from '../../../models/users/user/user.model'
import type { User } from '../../../interfaces/models/users/user/user.interface'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

const SECRET_FIELDS = '+passwordHash +tokenVersion'

class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel)
  }

  findByLogin(identifier: string) {
    const normalized = identifier.trim()
    const filter: QueryFilter<User> = normalized.includes('@')
      ? { email: normalized.toLowerCase() }
      : { userName: normalized }
    return this.model.findOne(this.active(filter)).select(SECRET_FIELDS)
  }

  findByUserName(userName: string) {
    return this.model.findOne(this.active({ userName }))
  }

  findByIdWithSecrets(id: string) {
    return this.findById(id).select(SECRET_FIELDS)
  }

  findAuthState(id: string) {
    return this.model.findOne(this.active({ _id: toObjectId(id) }), 'role +tokenVersion').lean()
  }

  async isEmailTaken(email: string, exceptId?: string): Promise<boolean> {
    return this.isTaken({ email: email.toLowerCase() }, exceptId)
  }

  async isUserNameTaken(userName: string, exceptId?: string): Promise<boolean> {
    return this.isTaken({ userName }, exceptId)
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
