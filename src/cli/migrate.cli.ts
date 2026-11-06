import { connectDatabase, disconnectDatabase } from '../config/database/database.config'
import { runPendingMigrations } from '../services/system/migration/migration.service'
import { logger } from '../utilities/logging/logger.utility'

/** Applies pending migrations in order. Safe to run repeatedly (runs before every production start). */
const run = async (): Promise<void> => {
  await connectDatabase()
  const applied = await runPendingMigrations()
  logger.info(applied.length > 0 ? `Applied migrations: ${applied.join(', ')}` : 'No pending migrations')
  await disconnectDatabase()
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
