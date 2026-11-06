import { acceptAllFollowRequests } from '../follow-request/follow-request.service'
import { isOnline } from '../../chat/realtime/presence.service'
import { broadcastPresence } from '../../chat/realtime/realtime-relay.service'
import { MessagePermission } from '../../../enums/users/settings/message-permission.enum'
import type { UpdateSettingsDto } from '../../../dtos/users/settings/update-settings.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { SettingsValues } from '../../../interfaces/models/users/settings/settings-values.interface'
import { followRepository } from '../../../repositories/users/follow/follow.repository'
import { userSettingsRepository } from '../../../repositories/users/settings/user-settings.repository'

export const getSettings = (actor: AuthUser): Promise<SettingsValues> => userSettingsRepository.findValues(actor.id)

export const updateSettings = async (dto: UpdateSettingsDto, actor: AuthUser): Promise<SettingsValues> => {
  const saved = await userSettingsRepository.saveValues(actor.id, dto)
  if (dto.privateAccount === false) await acceptAllFollowRequests(actor.id)
  const changesPresence = dto.presence !== undefined || dto.statusText !== undefined || dto.showActivityStatus !== undefined
  if (changesPresence) await broadcastPresence(actor.id, isOnline(actor.id))
  return saved
}

/** `messagePermission`: people who only accept messages from accounts they follow. */
export const acceptsMessagesFrom = async (recipientId: string, senderId: string): Promise<boolean> => {
  const settings = await userSettingsRepository.findValues(recipientId)
  if (settings.messagePermission === MessagePermission.EVERYONE) return true
  return followRepository.has(recipientId, senderId)
}

/** Of `userIds`, those who turned a privacy setting off (activity status or read receipts). */
export const findUsersHiding = async (
  userIds: string[],
  key: 'showActivityStatus' | 'readReceipts'
): Promise<Set<string>> => {
  const settings = await userSettingsRepository.findValuesForUsers(userIds)
  return new Set(userIds.filter((id) => settings.get(id)?.[key] === false))
}
