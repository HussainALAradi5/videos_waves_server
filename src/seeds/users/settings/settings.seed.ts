import { DEMO_SETTINGS } from '../../../constants/seeds/demo-content.constants'
import { userSettingsRepository } from '../../../repositories/users/settings/user-settings.repository'
import { actAs } from '../../common/seed-actor'

/** Saving the same values again changes nothing, so this is safe to re-run. */
export const seedSettings = async (): Promise<void> => {
  for (const [userName, values] of Object.entries(DEMO_SETTINGS)) {
    const actor = await actAs(userName)
    await userSettingsRepository.saveValues(actor.id, values)
  }
}
