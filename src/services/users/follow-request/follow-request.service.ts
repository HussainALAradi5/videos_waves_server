import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { UserSummaryResponseDto } from '../../../dtos/users/follow/user-summary-response.dto'
import { NotificationKind } from '../../../enums/notifications/notification/notification-kind.enum'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { FollowRequestWithUser } from '../../../interfaces/models/users/follow-request/follow-request-with-user.interface'
import { followRequestRepository } from '../../../repositories/users/follow-request/follow-request.repository'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { notFound } from '../../../utilities/errors/app-error.utility'
import { notify } from '../../notifications/notification/notification.service'
import { addFollow, toUserSummaries } from '../follow/follow.service'
import { findVisibleUserOrFail, getHiddenUserIds } from '../visibility/visibility.service'

/** People waiting for the signed-in user to accept their follow request, newest first. */
export const listFollowRequests = async (query: RelationQueryDto, actor: AuthUser): Promise<PageResult<UserSummaryResponseDto>> => {
  const hidden = await getHiddenUserIds(actor.id)
  const page = await followRequestRepository.paginateSources<FollowRequestWithUser>(actor.id, query, USER_PUBLIC_FIELDS, hidden)
  const people = page.items.flatMap((row) => (row.requester ? [row.requester] : []))
  return { items: await toUserSummaries(people, actor.id), meta: page.meta }
}

/** Turns the request into a follow (with both counters) and tells the requester. */
export const acceptFollowRequest = async (userName: string, actor: AuthUser): Promise<{ userName: string; followsYou: boolean }> => {
  const requester = await findVisibleUserOrFail(userName, actor.id)
  const requesterId = requester._id.toString()
  if (!(await followRequestRepository.has(requesterId, actor.id))) throw notFound(MESSAGES.SOCIAL.REQUEST_NOT_FOUND)
  await withTransaction(async () => {
    await followRequestRepository.remove(requesterId, actor.id)
    await addFollow(requesterId, actor.id)
  })
  await notify({ userId: requesterId, kind: NotificationKind.FOLLOW_ACCEPTED, actorId: actor.id })
  return { userName: requester.userName, followsYou: true }
}

/** Idempotent: declining a request that is gone changes nothing. The requester is not told. */
export const declineFollowRequest = async (userName: string, actor: AuthUser): Promise<{ userName: string; followsYou: boolean }> => {
  const requester = await findVisibleUserOrFail(userName, actor.id)
  await followRequestRepository.remove(requester._id.toString(), actor.id)
  return { userName: requester.userName, followsYou: false }
}

/** Going public accepts everyone who was waiting, as Instagram does. */
export const acceptAllFollowRequests = async (userId: string): Promise<void> => {
  const requesterIds = [...(await followRequestRepository.findSourceIds(userId))]
  for (const requesterId of requesterIds) {
    await withTransaction(async () => {
      await followRequestRepository.remove(requesterId, userId)
      await addFollow(requesterId, userId)
    })
  }
}
