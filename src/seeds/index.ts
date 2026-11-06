import { isProduction } from '../config'
import { connectDatabase, disconnectDatabase } from '../config/database/database.config'
import { SEED_CREDENTIALS_FILE } from '../constants/users/user/seed-users.constants'
import { logger } from '../utilities/logging/logger.utility'
import { seedUsers } from './users/user/users.seed'

export const runSeeds = async (): Promise<void> => {
  if (isProduction) throw new Error('Seeding is disabled in production.')
  const created = await seedUsers()
  const count = Object.keys(created).length
  logger.info(count > 0 ? `Seed credentials written to ${SEED_CREDENTIALS_FILE}` : 'Seed users already exist')
}

if (require.main === module) {
  connectDatabase()
    .then(runSeeds)
    .catch((error: unknown) => {
      logger.error('Seeding failed', { error: error instanceof Error ? error.message : String(error) })
      process.exitCode = 1
    })
    .finally(disconnectDatabase)
}
