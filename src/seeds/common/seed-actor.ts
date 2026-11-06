import type { AuthUser } from '../../interfaces/users/auth/auth-user.interface'
import { userRepository } from '../../repositories/users/user/user.repository'

/** Acts as a seeded user, so demo content goes through the same services and rules as the API. */
export const actAs = async (userName: string): Promise<AuthUser> => {
  const user = await userRepository.findByUserName(userName)
  if (!user) throw new Error(`Seed user ${userName} is missing`)
  return { id: user._id.toString(), role: user.role, sessionId: '' }
}
