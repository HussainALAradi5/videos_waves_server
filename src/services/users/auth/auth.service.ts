import { Types } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { RegisterDto } from '../../../dtos/users/auth/register.dto'
import type { LoginDto } from '../../../dtos/users/auth/login.dto'
import type { AuthResponseDto } from '../../../dtos/users/auth/auth-response.dto'
import type { User } from '../../../interfaces/models/users/user/user.interface'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toUserResponse } from '../../../mappers/users/user/user.mapper'
import { comparePassword, hashPassword, TIMING_SAFE_DUMMY_HASH } from '../../../utilities/security/password.utility'
import { conflict, forbidden, unauthorized } from '../../../utilities/errors/app-error.utility'
import { startSession } from './session.service'

/** Signs the user in on this device and returns their tokens with their profile. */
export const buildAuthResponse = async (user: User, userAgent: string): Promise<AuthResponseDto> => ({
  ...(await startSession(user, userAgent)),
  user: toUserResponse(user)
})

export const assertIdentityAvailable = async (
  identity: { email?: string; userName?: string },
  exceptId?: string
): Promise<void> => {
  if (identity.email && (await userRepository.isEmailTaken(identity.email, exceptId))) {
    throw conflict(MESSAGES.USERS.EMAIL_TAKEN)
  }
  if (identity.userName && (await userRepository.isUserNameTaken(identity.userName, exceptId))) {
    throw conflict(MESSAGES.USERS.USER_NAME_TAKEN)
  }
}

export const register = async (dto: RegisterDto, userAgent: string): Promise<AuthResponseDto> => {
  await assertIdentityAvailable(dto)
  // Self-registration: the new user is the actor of their own creation.
  const id = new Types.ObjectId()
  const user = await userRepository.create(
    {
      _id: id,
      userName: dto.userName,
      email: dto.email,
      gender: dto.gender,
      passwordHash: await hashPassword(dto.password)
    },
    id.toString()
  )
  return buildAuthResponse(user, userAgent)
}

/**
 * Unknown accounts still run one bcrypt comparison (against a dummy hash), so response time does
 * not reveal which usernames or emails exist.
 */
export const login = async (dto: LoginDto, userAgent: string): Promise<AuthResponseDto> => {
  const user = await userRepository.findByLogin(dto.identifier)
  const isValid = await comparePassword(dto.password, user?.passwordHash ?? TIMING_SAFE_DUMMY_HASH)
  if (!user || !isValid) throw unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS)
  if (user.deactivatedAt) throw forbidden(MESSAGES.AUTH.ACCOUNT_DEACTIVATED)
  return buildAuthResponse(user, userAgent)
}
