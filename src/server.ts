import { env } from './config'
import { connectDatabase } from './config/database/database.config'
import { createApp } from './app'
import { logger } from './utilities/logging/logger.utility'

const start = async (): Promise<void> => {
  await connectDatabase()
  createApp().listen(env.PORT, () => logger.info(`Server listening on port ${env.PORT}`))
}

start().catch((error: unknown) => {
  logger.error('Server failed to start', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})
