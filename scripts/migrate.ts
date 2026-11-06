/** Applies pending migrations in order: `npm run migrate`. Safe to run repeatedly. */
import { connectDatabase, disconnectDatabase } from '../src/config/database/database.config'
import { runPendingMigrations } from '../src/services/system/migration/migration.service'

const run = async (): Promise<void> => {
  await connectDatabase()
  const applied = await runPendingMigrations()
  console.log(applied.length > 0 ? `Applied: ${applied.join(', ')}` : 'No pending migrations.')
  await disconnectDatabase()
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
