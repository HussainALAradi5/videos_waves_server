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
    [SettingKey.BUBBLE_COLOR]: z.enum(BubbleColor)
  })
  .partial()
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, { message: 'Provide at least one setting to update.' })

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>
