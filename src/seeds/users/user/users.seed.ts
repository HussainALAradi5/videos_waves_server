import { randomBytes } from 'crypto'
import { writeFile } from 'fs/promises'
import { Types } from 'mongoose'
import { env } from '../../../config'
import { SEED_CREDENTIALS_FILE, SEED_USERS } from '../../../constants/users/user/seed-users.constants'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { hashPassword } from '../../../utilities/security/password.utility'
import { logger } from '../../../utilities/logging/logger.utility'

// Generated passwords satisfy the password rule: upper, lower, and a digit.
const generatePassword = (): string => `Vw${randomBytes(9).toString('base64url')}9a`

/** Creates any missing seed user and returns the credentials of the users it created. */
export const seedUsers = async (): Promise<Record<string, string>> => {
  const created: Record<string, string> = {}
  for (const seed of SEED_USERS) {
    if (await userRepository.isEmailTaken(seed.email)) continue
    const password = env[seed.passwordEnv] || generatePassword()
    const id = new Types.ObjectId()
    await userRepository.create(
      { _id: id, userName: seed.userName, email: seed.email, role: seed.role, passwordHash: await hashPassword(password) },
      id.toString()
    )
    created[seed.email] = password
    logger.info(`Seeded ${seed.role} user`, { email: seed.email })
  }
  if (Object.keys(created).length > 0) {
    await writeFile(SEED_CREDENTIALS_FILE, `${JSON.stringify(created, null, 2)}\n`)
  }
  return created
}
