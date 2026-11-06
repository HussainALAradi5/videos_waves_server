import { MESSAGES } from '../../../constants/common/messages.constants'
import type { UpdateAccountStatusDto } from '../../../dtos/users/account-status/update-account-status.dto'
import type { UserResponseDto } from '../../../dtos/users/user/user-response.dto'
import { Role } from '../../../enums/users/roles/role.enum'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { toUserResponse } from '../../../mappers/users/user/user.mapper'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { badRequest, forbidden, notFound } from '../../../utilities/errors/app-error.utility'
import { revokeAllSessions } from '../auth/session.service'

/**
 * An admin deactivates or reactivates a regular user. Deactivation is a reversible status, not a
 * delete: the account cannot sign in, every device is signed out, and its videos, comments, profile,
 * and search results are hidden (see getHiddenUserIds). Reactivating shows everything again.
 */
export const setAccountActive = async (
  userName: string,
  dto: UpdateAccountStatusDto,
  actor: AuthUser
): Promise<UserResponseDto> => {
  const target = await userRepository.findByUserName(userName)
  if (!target) throw notFound(MESSAGES.USERS.NOT_FOUND)
  const targetId = target._id.toString()
  if (targetId === actor.id) throw badRequest(MESSAGES.USERS.CANNOT_DEACTIVATE_SELF)
  if (target.role === Role.ADMIN) throw forbidden(MESSAGES.USERS.CANNOT_DEACTIVATE_ADMIN)
  await userRepository.setDeactivated(targetId, !dto.isActive, actor.id)
  if (!dto.isActive) await revokeAllSessions(targetId)
  const updated = await userRepository.findByUserName(userName)
  return toUserResponse(updated!)
}
