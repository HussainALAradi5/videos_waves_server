import type { QueryFilter } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { UpdateProfileDto } from '../../../dtos/users/user/update-profile.dto'
import type { ChangePasswordDto } from '../../../dtos/users/user/change-password.dto'
import type { UserQueryDto } from '../../../dtos/users/user/user-query.dto'
import type { UserResponseDto } from '../../../dtos/users/user/user-response.dto'
import type { AuthResponseDto } from '../../../dtos/users/auth/auth-response.dto'
import type { User } from '../../../interfaces/models/users/user/user.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toUserResponse } from '../../../mappers/users/user/user.mapper'
import { comparePassword, hashPassword } from '../../../utilities/security/password.utility'
import { badRequest, notFound } from '../../../utilities/errors/app-error.utility'
import { escapeRegex } from '../../../utilities/strings/escape-regex.utility'
import { assertIdentityAvailable, buildAuthResponse } from '../auth/auth.service'
import { revokeAllSessions } from '../auth/session.service'
import type { UpdateAvatarDto } from '../../../dtos/users/user/update-avatar.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'
import { toMediaResponse } from '../../../mappers/media/media/media.mapper'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { claimMedia, releaseMedia } from '../../media/media/media.service'
import { purgeProviderFiles } from '../../media/media/media-cleanup.service'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { UserSearchQueryDto } from '../../../dtos/users/user/user-search-query.dto'
import type { UserSummaryResponseDto } from '../../../dtos/users/follow/user-summary-response.dto'
import { buildPeopleMatch } from '../../../utilities/users/contact.utility'
import { buildPageMeta } from '../../../utilities/pagination/paginate.utility'
import { AccountStatus } from '../../../enums/users/user/account-status.enum'
import { getHiddenUserIds } from '../visibility/visibility.service'
import { toUserSummaries } from '../follow/follow.service'

const findUserOrFail = async (userId: string) => {
  const user = await userRepository.findById(userId)
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  return user
}

export const getProfile = async (userId: string): Promise<UserResponseDto> =>
  toUserResponse(await findUserOrFail(userId))

export const updateProfile = async (userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> => {
  await assertIdentityAvailable(dto, userId)
  const user = await userRepository.updateById(userId, { $set: dto }, userId)
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  return toUserResponse(user)
}

/** Sets (or with `mediaId: null`, removes) the avatar; the previous avatar file is deleted after commit. */
export const updateAvatar = async (dto: UpdateAvatarDto, actor: AuthUser): Promise<UserResponseDto> => {
  const current = await findUserOrFail(actor.id)
  const previousMediaId = current.avatar?.toString() ?? null
  const user = await withTransaction(async () => {
    const [media] = dto.mediaId ? await claimMedia([dto.mediaId], MediaKind.AVATAR, actor) : []
    if (previousMediaId) await releaseMedia([previousMediaId], actor.id)
    const avatar = media ? { avatar: toObjectId(media._id.toString()), avatarUrl: toMediaResponse(media).url } : null
    return userRepository.updateById(actor.id, { $set: avatar ?? { avatar: null, avatarUrl: null } }, actor.id)
  })
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  if (previousMediaId) await purgeProviderFiles([previousMediaId])
  return toUserResponse(user)
}

/** Changes the password, signs every device out, and returns a fresh session for this one. */
export const changePassword = async (
  userId: string,
  dto: ChangePasswordDto,
  userAgent: string
): Promise<AuthResponseDto> => {
  const user = await userRepository.findByIdWithSecrets(userId)
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  if (!(await comparePassword(dto.currentPassword, user.passwordHash))) {
    throw badRequest(MESSAGES.USERS.CURRENT_PASSWORD_INCORRECT)
  }
  user.passwordHash = await hashPassword(dto.newPassword)
  user.updatedBy = user._id
  await user.save()
  await revokeAllSessions(userId)
  const refreshed = await userRepository.findByIdWithSecrets(userId)
  if (!refreshed) throw notFound(MESSAGES.USERS.NOT_FOUND)
  return buildAuthResponse(refreshed, userAgent)
}

export const deactivateAccount = async (userId: string): Promise<void> => {
  const isDeleted = await userRepository.softDeleteById(userId, userId)
  if (!isDeleted) throw notFound(MESSAGES.USERS.NOT_FOUND)
  await revokeAllSessions(userId)
}

/**
 * People search (Search tab, new message, add to group): any part of a username, email, or phone
 * number, ignoring case. Phones match on their digits, so `555 0100` finds `+15550100004`; the phone
 * itself is never returned. An empty box finds no one. Hidden and deactivated users never appear.
 */
export const searchUsers = async (
  query: UserSearchQueryDto,
  viewerId?: string
): Promise<PageResult<UserSummaryResponseDto>> => {
  const conditions = query.search ? buildPeopleMatch(query.search) : []
  if (conditions.length === 0) return { items: [], meta: buildPageMeta(query.page, query.pageSize, 0) }
  const hidden = await getHiddenUserIds(viewerId)
  const filter: QueryFilter<User> = { $or: conditions }
  if (hidden.length > 0) filter._id = { $nin: hidden.map(toObjectId) }
  const page = await userRepository.paginate<User>(filter, query, { projection: USER_PUBLIC_FIELDS })
  return { items: await toUserSummaries(page.items, viewerId), meta: page.meta }
}

/** Admin list with private fields (email, role). */
/** Search, role, and status filters of the admin users list (also used by the CSV export). */
export const buildUserListFilter = (query: Pick<UserQueryDto, 'search' | 'role' | 'status'>): QueryFilter<User> => {
  const filter: QueryFilter<User> = {}
  if (query.role) filter.role = query.role
  if (query.status) filter.deactivatedAt = query.status === AccountStatus.ACTIVE ? null : { $ne: null }
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [{ userName: pattern }, { email: pattern }, { phone: pattern }]
  }
  return filter
}

/** Admin list with private fields (email, role, status), including deactivated accounts. */
export const listUsers = async (query: UserQueryDto): Promise<PageResult<UserResponseDto>> => {
  const page = await userRepository.paginate<User>(buildUserListFilter(query), query)
  return { items: page.items.map(toUserResponse), meta: page.meta }
}
