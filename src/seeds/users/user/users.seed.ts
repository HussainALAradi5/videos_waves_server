import { randomBytes } from 'crypto'
import { writeFile } from 'fs/promises'
import { Types } from 'mongoose'
import { env } from '../../../config'
import { SEED_CREDENTIALS_FILE, SEED_PASSWORD_ENV, SEED_USERS } from '../../../constants/users/user/seed-users.constants'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { revokeAllSessions } from '../../../services/users/auth/session.service'
import { logger } from '../../../utilities/logging/logger.utility'
import { comparePassword, hashPassword } from '../../../utilities/security/password.utility'

// Generated passwords satisfy the password rule: upper, lower, and a digit.
const generatePassword = (): string => `Vw${randomBytes(9).toString('base64url')}9a`

const configuredPassword = (role: keyof typeof SEED_PASSWORD_ENV): string | undefined => env[SEED_PASSWORD_ENV[role]]

/**
 * Brings a public demo account back: reactivates it if a visitor deactivated it, and resets a changed
 * password (signing out every device). Re-running the seed after a deploy therefore restores the demo.
 */
const restoreDemoAccount = async (email: string, password: string): Promise<void> => {
  const id = await userRepository.findIdByEmailIncludingDeleted(email)
  if (id && (await userRepository.restoreById(id, null))) logger.info('Reactivated demo account', { email })
  if (id && (await userRepository.isDeactivated(id))) await userRepository.setDeactivated(id, false, null)
  const user = await userRepository.findByLogin(email)
  if (!user || (await comparePassword(password, user.passwordHash))) return
  await userRepository.updateById(user._id.toString(), { $set: { passwordHash: await hashPassword(password) } }, null)
  await revokeAllSessions(user._id.toString())
  logger.info('Restored demo password', { email })
}

/** Creates missing demo users, restores configured passwords, and returns generated credentials. */
export const seedUsers = async (): Promise<Record<string, string>> => {
  const generated: Record<string, string> = {}
  for (const seed of SEED_USERS) {
    const configured = configuredPassword(seed.role)
    if (await userRepository.isEmailTaken(seed.email)) {
      if (configured) await restoreDemoAccount(seed.email, configured)
      continue
    }
    const password = configured ?? generatePassword()
    const id = new Types.ObjectId()
    await userRepository.create(
      {
        _id: id,
        userName: seed.userName,
        email: seed.email,
        role: seed.role,
        gender: seed.gender,
        bio: seed.bio,
        passwordHash: await hashPassword(password)
      },
      id.toString()
    )
    if (!configured) generated[seed.email] = password
    logger.info(`Seeded ${seed.role} user`, { userName: seed.userName })
  }
  if (Object.keys(generated).length > 0) {
    await writeFile(SEED_CREDENTIALS_FILE, `${JSON.stringify(generated, null, 2)}\n`)
  }
  return generated
}
