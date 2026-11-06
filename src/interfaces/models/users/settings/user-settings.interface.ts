import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'
import type { SettingsValues } from './settings-values.interface'

export interface UserSettings extends BaseEntity, SettingsValues {
  user: Types.ObjectId
}
