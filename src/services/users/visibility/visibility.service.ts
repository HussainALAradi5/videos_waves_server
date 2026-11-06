import { MESSAGES } from '../../../constants/common/messages.constants'
import { blockRepository } from '../../../repositories/users/block/block.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { notFound } from '../../../utilities/errors/app-error.utility'

/**
 * Users the viewer must never see: everyone they blocked and everyone who blocked them. Every list
 * (feed, comments, followers, search, chat) excludes these ids, so a block hides both people everywhere.
 */
export const getHiddenUserIds = async (viewerId?: string): Promise<string[]> => {
  if (!viewerId) return []
  const [blockedByMe, blockedMe] = await Promise.all([
    blockRepository.findTargetIds(viewerId),
    blockRepository.findSourceIds(viewerId)
  ])
  return [...new Set([...blockedByMe, ...blockedMe])]
}

export const isBlockedEitherWay = async (firstId: string, secondId: string): Promise<boolean> => {
  const [forward, backward] = await Promise.all([
    blockRepository.has(firstId, secondId),
    blockRepository.has(secondId, firstId)
  ])
  return forward || backward
}

/**
 * Loads a user by name for `viewerId`. A user who blocked the viewer looks like they do not exist
 * (404, as on Instagram); a user the viewer blocked stays reachable so they can be unblocked.
 */
export const findVisibleUserOrFail = async (userName: string, viewerId?: string) => {
  const user = await userRepository.findByUserName(userName)
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  if (viewerId && (await blockRepository.has(user._id.toString(), viewerId))) throw notFound(MESSAGES.USERS.NOT_FOUND)
  return user
}
