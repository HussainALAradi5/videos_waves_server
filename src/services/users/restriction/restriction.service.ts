import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { RelationStateResponseDto } from '../../../dtos/users/block/relation-state-response.dto'
import type { PublicUserResponseDto } from '../../../dtos/users/user/public-user-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import { restrictionRepository } from '../../../repositories/users/restriction/restriction.repository'
import { toPublicUser } from '../../../mappers/users/user/user.mapper'
import { badRequest } from '../../../utilities/errors/app-error.utility'
import { findVisibleUserOrFail } from '../visibility/visibility.service'

const findTargetOrFail = async (userName: string, actor: AuthUser) => {
  const target = await findVisibleUserOrFail(userName, actor.id)
  if (target._id.toString() === actor.id) throw badRequest(MESSAGES.SOCIAL.CANNOT_RESTRICT_SELF)
  return target
}

/** True when `restricterId` restricted `userId`; comments and chat use it. */
export const isRestrictedBy = (restricterId: string, userId: string): Promise<boolean> =>
  restrictionRepository.has(restricterId, userId)

/**
 * Restricts a user, as on Instagram: their new comments on your videos are visible only to them
 * and to you until you approve them, their messages go to your requests, and they cannot see when
 * you have read their messages. They are not told.
 */
export const restrictUser = async (userName: string, actor: AuthUser): Promise<RelationStateResponseDto> => {
  const target = await findTargetOrFail(userName, actor)
  await restrictionRepository.addOnce(actor.id, target._id.toString())
  return { userName: target.userName, isActive: true }
}

export const unrestrictUser = async (userName: string, actor: AuthUser): Promise<RelationStateResponseDto> => {
  const target = await findTargetOrFail(userName, actor)
  await restrictionRepository.remove(actor.id, target._id.toString())
  return { userName: target.userName, isActive: false }
}

export const listRestrictedUsers = async (
  query: RelationQueryDto,
  actor: AuthUser
): Promise<PageResult<PublicUserResponseDto>> => {
  const page = await restrictionRepository.paginateTargets<{ restricted: PublicUserSource | null }>(
    actor.id,
    query,
    USER_PUBLIC_FIELDS
  )
  return {
    items: page.items.flatMap((row) => (row.restricted ? [toPublicUser(row.restricted)] : [])),
    meta: page.meta
  }
}
