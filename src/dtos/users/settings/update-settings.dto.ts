import { STATUS_TEXT_MAX } from '../../../constants/users/settings/settings.constants'
import { PresenceMode } from '../../../enums/users/settings/presence-mode.enum'
import { BubbleStyle } from '../../../enums/users/settings/bubble-style.enum'
import { z } from 'zod'
import { BubbleColor } from '../../../enums/users/settings/bubble-color.enum'
import { MessagePermission } from '../../../enums/users/settings/message-permission.enum'
import { SettingKey } from '../../../enums/users/settings/setting-key.enum'
import { ThemePreference } from '../../../enums/users/settings/theme-preference.enum'

/** Any subset of setting keys; unknown keys are rejected. */
export const updateSettingsSchema = z
  .object({
    [SettingKey.THEME]: z.enum(ThemePreference),
    [SettingKey.AUTOPLAY_VIDEOS]: z.boolean(),
    [SettingKey.SHOW_ACTIVITY_STATUS]: z.boolean(),
    [SettingKey.READ_RECEIPTS]: z.boolean(),
    [SettingKey.MESSAGE_PERMISSION]: z.enum(MessagePermission),
    [SettingKey.MESSAGE_PREVIEWS]: z.boolean(),
    [SettingKey.MESSAGE_SOUND]: z.boolean(),
    [SettingKey.BUBBLE_COLOR]: z.enum(BubbleColor),
    [SettingKey.OTHERS_BUBBLE_COLOR]: z.enum(BubbleColor),
    [SettingKey.BUBBLE_STYLE]: z.enum(BubbleStyle),
    [SettingKey.NOTIFY_MESSAGES]: z.boolean(),
    [SettingKey.PRESENCE]: z.enum(PresenceMode),
    [SettingKey.STATUS_TEXT]: z.string().trim().max(STATUS_TEXT_MAX),
    [SettingKey.PRIVATE_ACCOUNT]: z.boolean()
  })
  .partial()
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, { message: 'Provide at least one setting to update.' })

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>
