import { Types } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { TokenType } from '../../../enums/users/auth/token-type.enum'
import type { RegisterDto } from '../../../dtos/users/auth/register.dto'
import type { LoginDto } from '../../../dtos/users/auth/login.dto'
import type { RefreshTokenDto } from '../../../dtos/users/auth/refresh-token.dto'
import type { AuthResponseDto, AuthTokensDto } from '../../../dtos/users/auth/auth-response.dto'
import type { User } from '../../../interfaces/models/users/user/user.interface'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toUserResponse } from '../../../mappers/users/user/user.mapper'
import { comparePassword, hashPassword } from '../../../utilities/security/password.utility'
import { conflict, unauthorized } from '../../../utilities/errors/app-error.utility'
import { issueTokens, verifyToken } from './token.service'

export const buildAuthResponse = (user: User): AuthResponseDto => ({
  ...issueTokens({ id: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion }),
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

export const register = async (dto: RegisterDto): Promise<AuthResponseDto> => {
  await assertIdentityAvailable(dto)
  // Self-registration: the new user is the actor of their own creation.
  const id = new Types.ObjectId()
  const user = await userRepository.create(
    { _id: id, userName: dto.userName, email: dto.email, passwordHash: await hashPassword(dto.password) },
    id.toString()
  )
  return buildAuthResponse(user)
}

export const login = async (dto: LoginDto): Promise<AuthResponseDto> => {
  const user = await userRepository.findByLogin(dto.identifier)
  const isValid = user !== null && (await comparePassword(dto.password, user.passwordHash))
  if (!user || !isValid) throw unauthorized(MESSAGES.AUTH.INVALID_CREDENTIALS)
  return buildAuthResponse(user)
}

export const refresh = async (dto: RefreshTokenDto): Promise<AuthTokensDto> => {
  const payload = verifyToken(dto.refreshToken, TokenType.REFRESH)
  const state = payload ? await userRepository.findAuthState(payload.sub) : null
  if (!payload || !state || state.tokenVersion !== payload.tokenVersion) {
    throw unauthorized(MESSAGES.AUTH.REFRESH_INVALID)
  }
  return issueTokens({ id: payload.sub, role: state.role, tokenVersion: state.tokenVersion })
}

/** Revokes every refresh token the user holds by bumping their token version. */
export const logout = async (userId: string): Promise<void> => {
  await userRepository.incrementTokenVersion(userId)
}
