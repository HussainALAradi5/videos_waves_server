import mongoose from 'mongoose'
import type { Migration } from '../interfaces/migrations/migration.interface'

/** Creates every index declared on the models (unique codes, partial uniques, sort and filter indexes). */
export const syncIndexesMigration: Migration = {
  id: '002-sync-indexes',
  description: 'Create all model indexes',
  up: async () => {
    for (const model of Object.values(mongoose.models)) await model.syncIndexes()
  }
}
