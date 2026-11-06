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

/** Changes the password, revokes older sessions, and returns a fresh session for this device. */
export const changePassword = async (userId: string, dto: ChangePasswordDto): Promise<AuthResponseDto> => {
  const user = await userRepository.findByIdWithSecrets(userId)
  if (!user) throw notFound(MESSAGES.USERS.NOT_FOUND)
  if (!(await comparePassword(dto.currentPassword, user.passwordHash))) {
    throw badRequest(MESSAGES.USERS.CURRENT_PASSWORD_INCORRECT)
  }
  user.passwordHash = await hashPassword(dto.newPassword)
  user.tokenVersion += 1
  user.updatedBy = user._id
  await user.save()
  return buildAuthResponse(user)
}

export const deactivateAccount = async (userId: string): Promise<void> => {
  const isDeleted = await userRepository.softDeleteById(userId, userId)
  if (!isDeleted) throw notFound(MESSAGES.USERS.NOT_FOUND)
  await userRepository.incrementTokenVersion(userId)
}

export const listUsers = async (query: UserQueryDto): Promise<PageResult<UserResponseDto>> => {
  const filter: QueryFilter<User> = {}
  if (query.role) filter.role = query.role
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [{ userName: pattern }, { email: pattern }]
  }
  const page = await userRepository.paginate<User>(filter, query)
  return { items: page.items.map(toUserResponse), meta: page.meta }
}
