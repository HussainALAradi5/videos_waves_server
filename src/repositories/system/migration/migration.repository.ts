import type { MigrationRecord } from '../../../interfaces/models/system/migration/migration-record.interface'
import { MigrationModel } from '../../../models/system/migration/migration.model'
import { BaseRepository } from '../../base/base.repository'

class MigrationRepository extends BaseRepository<MigrationRecord> {
  constructor() {
    super(MigrationModel)
  }

  async findAppliedIds(): Promise<Set<string>> {
    const records = await this.model.find(this.active(), 'migrationId').lean()
    return new Set(records.map((record) => record.migrationId))
  }
}

export const migrationRepository = new MigrationRepository()
