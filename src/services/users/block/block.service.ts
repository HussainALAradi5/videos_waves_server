import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { RelationQueryDto } from '../../../dtos/users/follow/relation-query.dto'
import type { RelationStateResponseDto } from '../../../dtos/users/block/relation-state-response.dto'
import type { PublicUserResponseDto } from '../../../dtos/users/user/public-user-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import { blockRepository } from '../../../repositories/users/block/block.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toPublicUser } from '../../../mappers/users/user/user.mapper'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { badRequest, notFound } from '../../../utilities/errors/app-error.utility'
import { removeFollow } from '../follow/follow.service'

const findTargetOrFail = async (userName: string, actor: AuthUser) => {
  const target = await userRepository.findByUserName(userName)
  if (!target) throw notFound(MESSAGES.USERS.NOT_FOUND)
  if (target._id.toString() === actor.id) throw badRequest(MESSAGES.SOCIAL.CANNOT_BLOCK_SELF)
  return target
}

/**
 * Blocks a user, as on Instagram: both follow directions are removed in the same transaction, and
 * from then on each person is hidden from the other's feed, profile, comments, search, and chat.
 */
export const blockUser = async (userName: string, actor: AuthUser): Promise<RelationStateResponseDto> => {
  const target = await findTargetOrFail(userName, actor)
  const targetId = target._id.toString()
  await withTransaction(async () => {
    await blockRepository.addOnce(actor.id, targetId)
    await removeFollow(actor.id, targetId)
    await removeFollow(targetId, actor.id)
  })
  return { userName: target.userName, isActive: true }
}

export const unblockUser = async (userName: string, actor: AuthUser): Promise<RelationStateResponseDto> => {
  const target = await findTargetOrFail(userName, actor)
  await blockRepository.remove(actor.id, target._id.toString())
  return { userName: target.userName, isActive: false }
}

export const listBlockedUsers = async (
  query: RelationQueryDto,
  actor: AuthUser
): Promise<PageResult<PublicUserResponseDto>> => {
  const page = await blockRepository.paginateTargets<{ blocked: PublicUserSource | null }>(
    actor.id,
    query,
    USER_PUBLIC_FIELDS
  )
  return { items: page.items.flatMap((row) => (row.blocked ? [toPublicUser(row.blocked)] : [])), meta: page.meta }
}
