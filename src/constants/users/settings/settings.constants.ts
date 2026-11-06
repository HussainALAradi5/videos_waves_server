import { BubbleColor } from '../../../enums/users/settings/bubble-color.enum'
import { MessagePermission } from '../../../enums/users/settings/message-permission.enum'
import { SettingKey } from '../../../enums/users/settings/setting-key.enum'
import { ThemePreference } from '../../../enums/users/settings/theme-preference.enum'
import type { SettingsValues } from '../../../interfaces/models/users/settings/settings-values.interface'

export const USER_SETTINGS_CODE_PREFIX = 'SET'

/** Used until a user changes a setting, so a missing settings row behaves exactly like the defaults. */
export const DEFAULT_SETTINGS: SettingsValues = {
  [SettingKey.THEME]: ThemePreference.SYSTEM,
  [SettingKey.AUTOPLAY_VIDEOS]: true,
  [SettingKey.SHOW_ACTIVITY_STATUS]: true,
  [SettingKey.READ_RECEIPTS]: true,
  [SettingKey.MESSAGE_PERMISSION]: MessagePermission.EVERYONE,
  [SettingKey.MESSAGE_PREVIEWS]: true,
  [SettingKey.MESSAGE_SOUND]: true,
  [SettingKey.BUBBLE_COLOR]: BubbleColor.WAVE
}

export const SETTING_KEYS = Object.values(SettingKey)
