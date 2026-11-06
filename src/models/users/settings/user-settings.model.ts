import { PresenceMode } from '../../../enums/users/settings/presence-mode.enum'
import { BubbleStyle } from '../../../enums/users/settings/bubble-style.enum'
import { Schema, model } from 'mongoose'
import { STATUS_TEXT_MAX, DEFAULT_SETTINGS, USER_SETTINGS_CODE_PREFIX } from '../../../constants/users/settings/settings.constants'
import { BubbleColor } from '../../../enums/users/settings/bubble-color.enum'
import { MessagePermission } from '../../../enums/users/settings/message-permission.enum'
import { SettingKey } from '../../../enums/users/settings/setting-key.enum'
import { ThemePreference } from '../../../enums/users/settings/theme-preference.enum'
import type { UserSettings } from '../../../interfaces/models/users/settings/user-settings.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const settingsSchema = new Schema<UserSettings>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  [SettingKey.THEME]: { type: String, enum: Object.values(ThemePreference), default: DEFAULT_SETTINGS.theme },
  [SettingKey.AUTOPLAY_VIDEOS]: { type: Boolean, default: DEFAULT_SETTINGS.autoplayVideos },
  [SettingKey.SHOW_ACTIVITY_STATUS]: { type: Boolean, default: DEFAULT_SETTINGS.showActivityStatus },
  [SettingKey.READ_RECEIPTS]: { type: Boolean, default: DEFAULT_SETTINGS.readReceipts },
  [SettingKey.MESSAGE_PERMISSION]: {
    type: String,
    enum: Object.values(MessagePermission),
    default: DEFAULT_SETTINGS.messagePermission
  },
  [SettingKey.MESSAGE_PREVIEWS]: { type: Boolean, default: DEFAULT_SETTINGS.messagePreviews },
  [SettingKey.MESSAGE_SOUND]: { type: Boolean, default: DEFAULT_SETTINGS.messageSound },
  [SettingKey.BUBBLE_COLOR]: { type: String, enum: Object.values(BubbleColor), default: DEFAULT_SETTINGS.bubbleColor },
  [SettingKey.OTHERS_BUBBLE_COLOR]: { type: String, enum: Object.values(BubbleColor), default: DEFAULT_SETTINGS.othersBubbleColor },
  [SettingKey.BUBBLE_STYLE]: { type: String, enum: Object.values(BubbleStyle), default: DEFAULT_SETTINGS.bubbleStyle },
  [SettingKey.NOTIFY_MESSAGES]: { type: Boolean, default: DEFAULT_SETTINGS.notifyMessages },
  [SettingKey.PRESENCE]: { type: String, enum: Object.values(PresenceMode), default: DEFAULT_SETTINGS.presence },
  [SettingKey.STATUS_TEXT]: { type: String, default: DEFAULT_SETTINGS.statusText, trim: true, maxlength: STATUS_TEXT_MAX },
  [SettingKey.PRIVATE_ACCOUNT]: { type: Boolean, default: DEFAULT_SETTINGS.privateAccount, index: true }
})

settingsSchema.plugin(baseEntityPlugin, { codePrefix: USER_SETTINGS_CODE_PREFIX })

export const UserSettingsModel = model<UserSettings>('UserSettings', settingsSchema)
