import { followRepository } from '../../../repositories/users/follow/follow.repository'
import { userSettingsRepository } from '../../../repositories/users/settings/user-settings.repository'

export const isPrivateAccount = async (userId: string): Promise<boolean> =>
  (await userSettingsRepository.findValues(userId)).privateAccount

/** The owner always; anyone for a public account; only approved followers for a private one. */
export const canViewContentOf = async (ownerId: string, viewerId?: string): Promise<boolean> => {
  if (ownerId === viewerId) return true
  if (!(await isPrivateAccount(ownerId))) return true
  return viewerId ? followRepository.has(viewerId, ownerId) : false
}

/** Private accounts whose videos the viewer may not see: every private account except their own and those they follow. */
export const findLockedOwnerIds = async (viewerId?: string): Promise<string[]> => {
  const privateIds = await userSettingsRepository.findPrivateUserIds()
  if (!viewerId || privateIds.length === 0) return privateIds
  const followed = await followRepository.findTargetIds(viewerId, privateIds)
  return privateIds.filter((id) => id !== viewerId && !followed.has(id))
}
