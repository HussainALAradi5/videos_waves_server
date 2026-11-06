import { canViewContentOf, isPrivateAccount } from '../privacy/privacy.service'
import { followRequestRepository } from '../../../repositories/users/follow-request/follow-request.repository'
import { NotificationKind } from '../../../enums/notifications/notification/notification-kind.enum'
import { notify } from '../../notifications/notification/notification.service'
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
import { badRequest, conflict, forbidden, notFound } from '../../../utilities/errors/app-error.utility'
import { findVisibleUserOrFail, getHiddenUserIds } from '../visibility/visibility.service'

/** Maps users to people-list rows with one follow lookup for the whole page. */
export const toUserSummaries = async (
  users: PublicUserSource[],
  viewerId?: string
): Promise<UserSummaryResponseDto[]> => {
  const ids = users.map((user) => user._id.toString())
  const [followed, requested] = viewerId
    ? await Promise.all([followRepository.findTargetIds(viewerId, ids), followRequestRepository.findTargetIds(viewerId, ids)])
    : [new Set<string>(), new Set<string>()]
  return users.map((user) => ({
    ...toPublicUser(user),
    isFollowing: followed.has(user._id.toString()),
    isRequested: requested.has(user._id.toString()),
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

const toFollowState = async (userName: string, userId: string, isFollowing: boolean, isRequested = false): Promise<FollowStateResponseDto> => {
  const user = await userRepository.findById(userId)
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  return { userName, isFollowing, isRequested, followersCount: user.followersCount }
}

/** Adds `followerId -> followingId` and both counters; returns false when it already existed. Call inside a transaction. */
export const addFollow = async (followerId: string, followingId: string): Promise<boolean> => {
  if (!(await followRepository.addOnce(followerId, followingId))) return false
  await userRepository.incrementCounter(followerId, 'followingCount', 1)
  await userRepository.incrementCounter(followingId, 'followersCount', 1)
  return true
}

/**
 * Idempotent; the follow row and both counters commit together. A private account gets a follow
 * request instead, which it accepts or declines (as on Instagram).
 */
export const followUser = async (userName: string, actor: AuthUser): Promise<FollowStateResponseDto> => {
  const target = await findVisibleUserOrFail(userName, actor.id)
  const targetId = target._id.toString()
  if (targetId === actor.id) throw badRequest(MESSAGES.SOCIAL.CANNOT_FOLLOW_SELF)
  if (await blockRepository.has(actor.id, targetId)) throw conflict(MESSAGES.SOCIAL.UNBLOCK_FIRST)
  if (!(await followRepository.has(actor.id, targetId)) && (await isPrivateAccount(targetId))) {
    if (await followRequestRepository.addOnce(actor.id, targetId)) {
      await notify({ userId: targetId, kind: NotificationKind.FOLLOW_REQUEST, actorId: actor.id })
    }
    return toFollowState(target.userName, targetId, false, true)
  }
  const isNew = await withTransaction(() => addFollow(actor.id, targetId))
  if (isNew) await notify({ userId: targetId, kind: NotificationKind.FOLLOW, actorId: actor.id })
  return toFollowState(target.userName, targetId, true)
}

/** Idempotent: unfollowing someone you do not follow changes nothing. Also cancels a pending request. */
export const unfollowUser = async (userName: string, actor: AuthUser): Promise<FollowStateResponseDto> => {
  const target = await findVisibleUserOrFail(userName, actor.id)
  const targetId = target._id.toString()
  await followRequestRepository.remove(actor.id, targetId)
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
  const userId = user._id.toString()
  if (!(await canViewContentOf(userId, viewerId))) throw forbidden(MESSAGES.SOCIAL.PRIVATE_ACCOUNT)
  const hidden = await getHiddenUserIds(viewerId)
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
