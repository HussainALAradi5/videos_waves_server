import { Schema, model } from 'mongoose'
import { MIGRATION_CODE_PREFIX } from '../../../constants/system/migration/migration.constants'
import type { MigrationRecord } from '../../../interfaces/models/system/migration/migration-record.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const migrationSchema = new Schema<MigrationRecord>({
  migrationId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  appliedAt: { type: Date, required: true }
})

migrationSchema.plugin(baseEntityPlugin, { codePrefix: MIGRATION_CODE_PREFIX })

export const MigrationModel = model<MigrationRecord>('Migration', migrationSchema)
