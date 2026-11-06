/** Removes stale pending uploads and retries failed CDN deletes: `npm run media:cleanup` (schedule it daily). */
import { connectDatabase, disconnectDatabase } from '../src/config/database/database.config'
import { purgeProviderFiles, removeStaleUploads } from '../src/services/media/media/media-cleanup.service'

const run = async (): Promise<void> => {
  await connectDatabase()
  const stale = await removeStaleUploads()
  const purged = await purgeProviderFiles()
  console.log(`Retired ${stale} stale uploads; deleted ${purged} provider files.`)
  await disconnectDatabase()
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
