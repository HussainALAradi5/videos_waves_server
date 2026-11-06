import type { ProfileResponseDto } from '../../../dtos/users/profile/profile-response.dto'
import { blockRepository } from '../../../repositories/users/block/block.repository'
import { followRepository } from '../../../repositories/users/follow/follow.repository'
import { restrictionRepository } from '../../../repositories/users/restriction/restriction.repository'
import { toPublicUser } from '../../../mappers/users/user/user.mapper'
import { Role } from '../../../enums/users/roles/role.enum'
import { findVisibleUserOrFail } from '../visibility/visibility.service'

const NO_RELATION = { isFollowing: false, followsYou: false, isBlocked: false, isRestricted: false }

const loadRelation = async (viewerId: string, userId: string) => {
  const [isFollowing, followsYou, isBlocked, isRestricted] = await Promise.all([
    followRepository.has(viewerId, userId),
    followRepository.has(userId, viewerId),
    blockRepository.has(viewerId, userId),
    restrictionRepository.has(viewerId, userId)
  ])
  return { isFollowing, followsYou, isBlocked, isRestricted }
}

/** A public profile with the viewer's relations to it (all false for guests and for oneself). */
export const getProfile = async (userName: string, viewerId?: string, viewerRole?: Role): Promise<ProfileResponseDto> => {
  const user = await findVisibleUserOrFail(userName, viewerId, viewerRole === Role.ADMIN)
  const userId = user._id.toString()
  const isMe = userId === viewerId
  const relation = viewerId && !isMe ? await loadRelation(viewerId, userId) : NO_RELATION
  return {
    ...toPublicUser(user),
    bio: user.bio,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    videosCount: user.videosCount,
    createdAt: user.createdAt.toISOString(),
    isMe,
    isActive: user.deactivatedAt === null,
    ...relation
  }
}
