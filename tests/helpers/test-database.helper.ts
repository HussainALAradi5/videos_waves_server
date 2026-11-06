import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connectDatabase, disconnectDatabase } from '../../src/config/database/database.config'

let mongo: MongoMemoryServer | null = null

export const startTestDatabase = async (): Promise<void> => {
  mongo = await MongoMemoryServer.create()
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
