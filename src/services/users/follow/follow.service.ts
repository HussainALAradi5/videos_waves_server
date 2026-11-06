import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { FollowStateResponseDto } from '../../../dtos/users/follow/follow-state-response.dto'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { UserSummaryResponseDto } from '../../../dtos/users/follow/user-summary-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { FollowWithUser } from '../../../interfaces/models/users/follow/follow-with-user.interface'
import { blockRepository } from '../../../repositories/users/block/block.repository'
import { followRepository } from '../../../repositories/users/follow/follow.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toPublicUser } from '../../../mappers/users/user/user.mapper'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { badRequest, conflict, notFound } from '../../../utilities/errors/app-error.utility'
import { findVisibleUserOrFail, getHiddenUserIds } from '../visibility/visibility.service'

/** Maps users to people-list rows with one follow lookup for the whole page. */
export const toUserSummaries = async (
  users: PublicUserSource[],
  viewerId?: string
): Promise<UserSummaryResponseDto[]> => {
  const followed = viewerId
    ? await followRepository.findTargetIds(viewerId, users.map((user) => user._id.toString()))
    : new Set<string>()
  return users.map((user) => ({
    ...toPublicUser(user),
    isFollowing: followed.has(user._id.toString()),
    isMe: user._id.toString() === viewerId
  }))
}

/** Removes `followerId -> followingId` and both counters; call inside a transaction. */
export const removeFollow = async (followerId: string, followingId: string): Promise<boolean> => {
  if (!(await followRepository.remove(followerId, followingId))) return false
  await userRepository.incrementCounter(followerId, 'followingCount', -1)
  await userRepository.incrementCounter(followingId, 'followersCount', -1)
  return true
}

const toFollowState = async (userName: string, userId: string, isFollowing: boolean): Promise<FollowStateResponseDto> => {
  const user = await userRepository.findById(userId)
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  return { userName, isFollowing, followersCount: user.followersCount }
}

/** Idempotent; the follow row and both counters commit together. */
export const followUser = async (userName: string, actor: AuthUser): Promise<FollowStateResponseDto> => {
  const target = await findVisibleUserOrFail(userName, actor.id)
  const targetId = target._id.toString()
  if (targetId === actor.id) throw badRequest(MESSAGES.SOCIAL.CANNOT_FOLLOW_SELF)
  if (await blockRepository.has(actor.id, targetId)) throw conflict(MESSAGES.SOCIAL.UNBLOCK_FIRST)
  await withTransaction(async () => {
    if (await followRepository.addOnce(actor.id, targetId)) {
      await userRepository.incrementCounter(actor.id, 'followingCount', 1)
      await userRepository.incrementCounter(targetId, 'followersCount', 1)
    }
  })
  return toFollowState(target.userName, targetId, true)
}

/** Idempotent: unfollowing someone you do not follow changes nothing. */
export const unfollowUser = async (userName: string, actor: AuthUser): Promise<FollowStateResponseDto> => {
  const target = await findVisibleUserOrFail(userName, actor.id)
  const targetId = target._id.toString()
  await withTransaction(() => removeFollow(actor.id, targetId))
  return toFollowState(target.userName, targetId, false)
}

type FollowSide = 'followers' | 'following'

/** Followers or following of a visible user; people hidden from the viewer by a block are left out. */
export const listFollows = async (
  side: FollowSide,
  userName: string,
  query: RelationQueryDto,
  viewerId?: string
): Promise<PageResult<UserSummaryResponseDto>> => {
  const user = await findVisibleUserOrFail(userName, viewerId)
  const hidden = await getHiddenUserIds(viewerId)
  const userId = user._id.toString()
  const page =
    side === 'followers'
      ? await followRepository.paginateSources<FollowWithUser>(userId, query, USER_PUBLIC_FIELDS, hidden)
      : await followRepository.paginateTargets<FollowWithUser>(userId, query, USER_PUBLIC_FIELDS, hidden)
  const people = page.items.flatMap((row) => {
    const person = side === 'followers' ? row.follower : row.following
    return person ? [person] : []
  })
  return { items: await toUserSummaries(people, viewerId), meta: page.meta }
}
