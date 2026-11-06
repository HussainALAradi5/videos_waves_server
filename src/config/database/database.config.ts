import mongoose from 'mongoose'
import { env } from '../index'
import { logger } from '../../utilities/logging/logger.utility'

export const connectDatabase = async (uri: string = env.MONGO_URI): Promise<void> => {
  mongoose.set('strictQuery', true)
  // Lets withTransaction() attach its session to every query in the callback.
  mongoose.set('transactionAsyncLocalStorage', true)
  const connection = await mongoose.connect(uri)
  logger.info(`MongoDB connected: ${connection.connection.host}`)
}

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect()
}
