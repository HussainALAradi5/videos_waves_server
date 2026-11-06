import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { connectDatabase, disconnectDatabase } from '../../src/config/database/database.config'

let mongo: MongoMemoryReplSet | null = null

export const startTestDatabase = async (): Promise<void> => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  await connectDatabase(mongo.getUri('videos_waves_test'))
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()))
}

export const clearTestDatabase = async (): Promise<void> => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})))
}

export const stopTestDatabase = async (): Promise<void> => {
  await disconnectDatabase()
  await mongo?.stop()
}
