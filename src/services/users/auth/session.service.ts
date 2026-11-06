import { MESSAGES } from '../../../constants/common/messages.constants'
import { TokenType } from '../../../enums/users/auth/token-type.enum'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { unauthorized } from '../../../utilities/errors/app-error.utility'
import { verifyToken } from './token.service'

/**
 * Verifies an access token and reloads role and token version from the database, so deactivated
 * users, revoked sessions, and role changes take effect immediately. Shared by HTTP and sockets.
 */
export const resolveAccessToken = async (token: string): Promise<AuthUser> => {
  const payload = verifyToken(token, TokenType.ACCESS)
  const state = payload ? await userRepository.findAuthState(payload.sub) : null
  if (!payload || !state || state.tokenVersion !== payload.tokenVersion) {
    throw unauthorized(MESSAGES.AUTH.TOKEN_INVALID)
  }
  return { id: payload.sub, role: state.role }
}
