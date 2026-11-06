import { MESSAGES } from '../../../constants/common/messages.constants'
import type { UpdateUserRoleDto } from '../../../dtos/users/user-role/update-user-role.dto'
import type { UserResponseDto } from '../../../dtos/users/user/user-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { toUserResponse } from '../../../mappers/users/user/user.mapper'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { badRequest, notFound } from '../../../utilities/errors/app-error.utility'
import { revokeAllSessions } from '../auth/session.service'

/**
 * An admin makes another user an admin or a regular user again. Admins can never change their own
 * role (so there is always someone who granted it). The role lives in the access token, so the
 * person is signed out everywhere and gets the new role on their next sign-in.
 */
export const setUserRole = async (userName: string, dto: UpdateUserRoleDto, actor: AuthUser): Promise<UserResponseDto> => {
  const target = await userRepository.findByUserName(userName)
  if (!target) throw notFound(MESSAGES.USERS.NOT_FOUND)
  const targetId = target._id.toString()
  if (targetId === actor.id) throw badRequest(MESSAGES.USERS.CANNOT_CHANGE_OWN_ROLE)
  if (target.role !== dto.role) {
    await userRepository.updateById(targetId, { $set: { role: dto.role } }, actor.id)
    await revokeAllSessions(targetId)
  }
  const updated = await userRepository.findByUserName(userName)
  return toUserResponse(updated!)
}
