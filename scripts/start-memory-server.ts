/**
 * Local demo without installing MongoDB: starts an in-memory MongoDB, seeds one user per role,
 * and serves the API. Data is lost when the process stops. Never use this in production.
 */
import { MongoMemoryServer } from 'mongodb-memory-server'

const start = async (): Promise<void> => {
  const mongo = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongo.getUri('videos_waves')

  // Imported after MONGO_URI is set because the config loader reads the environment once.
  const { env } = await import('../src/config')
  const { connectDatabase } = await import('../src/config/database/database.config')
  const { runSeeds } = await import('../src/seeds')
  const { createApp } = await import('../src/app')

  await connectDatabase()
  await runSeeds()
  createApp().listen(env.PORT, () => console.log(`In-memory API listening on port ${env.PORT}`))

  const stop = async (): Promise<void> => {
    await mongo.stop()
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

start().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
