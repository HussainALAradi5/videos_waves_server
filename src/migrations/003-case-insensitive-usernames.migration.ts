import { USERNAME_INDEX_NAME } from '../constants/users/user/user.constants'
import type { Migration } from '../interfaces/migrations/migration.interface'
import { UserModel } from '../models/users/user/user.model'

const OLD_INDEX = 'userName_1'

/**
 * Makes usernames unique ignoring case. Stops (and changes nothing) when two accounts already differ
 * only by case, listing them so an admin can rename one; otherwise swaps the old case-sensitive index
 * for the case-insensitive one.
 */
export const caseInsensitiveUserNamesMigration: Migration = {
  id: '003-case-insensitive-usernames',
  description: 'Unique usernames ignoring case',
  up: async () => {
    const clashes = await UserModel.aggregate<{ _id: string; names: string[] }>([
      { $group: { _id: { $toLower: '$userName' }, names: { $push: '$userName' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])
    if (clashes.length > 0) {
      const list = clashes.map((clash) => clash.names.join(' / ')).join(', ')
      throw new Error(`Usernames that differ only by case must be renamed first: ${list}`)
    }
    const indexes = await UserModel.collection.indexes()
    if (indexes.some((index) => index.name === OLD_INDEX)) await UserModel.collection.dropIndex(OLD_INDEX)
    if (!indexes.some((index) => index.name === USERNAME_INDEX_NAME)) await UserModel.syncIndexes()
  }
}
