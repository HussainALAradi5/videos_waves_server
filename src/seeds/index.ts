import { env, isProduction } from '../config'
import { connectDatabase, disconnectDatabase } from '../config/database/database.config'
import { SEED_CREDENTIALS_FILE } from '../constants/users/user/seed-users.constants'
import { logger } from '../utilities/logging/logger.utility'
import { seedChats } from './chat/conversation/chats.seed'
import { seedSettings } from './users/settings/settings.seed'
import { seedFollows } from './users/social/follows.seed'
import { seedUsers } from './users/user/users.seed'
import { seedComments } from './videos/comment/comments.seed'
import { seedVideos } from './videos/video/videos.seed'

/**
 * Production refuses to seed unless ALLOW_DEMO_SEED is on (a public demo), and then both demo
 * passwords must be configured so nothing is generated where no one can read it.
 */
const assertSeedingAllowed = (): void => {
  if (!isProduction) return
  if (!env.ALLOW_DEMO_SEED) throw new Error('Seeding is disabled in production. Set ALLOW_DEMO_SEED=true for a demo.')
  if (!env.SEED_ADMIN_PASSWORD || !env.SEED_USER_PASSWORD) {
    throw new Error('A production demo needs SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD.')
  }
}

export const runSeeds = async (): Promise<void> => {
  assertSeedingAllowed()
  const generated = await seedUsers()
  if (Object.keys(generated).length > 0) logger.info(`Generated seed passwords written to ${SEED_CREDENTIALS_FILE}`)
  await seedVideos()
  await seedFollows()
  await seedComments()
  await seedChats()
  await seedSettings()
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
