import { DEFAULT_SETTINGS, SETTING_KEYS } from '../../../constants/users/settings/settings.constants'
import type { SettingsValues } from '../../../interfaces/models/users/settings/settings-values.interface'
import type { UserSettings } from '../../../interfaces/models/users/settings/user-settings.interface'
import { UserSettingsModel } from '../../../models/users/settings/user-settings.model'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

/** Only the setting keys of a stored row, over the defaults; a missing row is all defaults. */
const toValues = (row: Partial<SettingsValues> | null): SettingsValues => {
  const values: SettingsValues = { ...DEFAULT_SETTINGS }
  if (!row) return values
  for (const key of SETTING_KEYS) {
    if (row[key] !== undefined) Object.assign(values, { [key]: row[key] })
  }
  return values
}

class UserSettingsRepository extends BaseRepository<UserSettings> {
  constructor() {
    super(UserSettingsModel)
  }

  async findValues(userId: string): Promise<SettingsValues> {
    return toValues(await this.model.findOne({ user: toObjectId(userId) }).lean())
  }

  /** Settings of many users in one query, keyed by user id (defaults for users without a row). */
  async findValuesForUsers(userIds: string[]): Promise<Map<string, SettingsValues>> {
    const rows = await this.model.find({ user: { $in: userIds.map(toObjectId) } }).lean()
    const byUser = new Map(rows.map((row) => [row.user.toString(), toValues(row)]))
    return new Map(userIds.map((id) => [id, byUser.get(id) ?? toValues(null)]))
  }

  async saveValues(userId: string, changes: Partial<SettingsValues>): Promise<SettingsValues> {
    const user = toObjectId(userId)
    const row = await this.model
      .findOneAndUpdate(
        { user },
        { $set: { ...changes, updatedBy: user }, $setOnInsert: { createdBy: user } },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
      )
      .lean()
    return toValues(row)
  }
}

export const userSettingsRepository = new UserSettingsRepository()
