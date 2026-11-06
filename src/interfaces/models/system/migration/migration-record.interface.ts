import type { BaseEntity } from '../../base/base-entity.interface'

export interface MigrationRecord extends BaseEntity {
  migrationId: string
  description: string
  appliedAt: Date
}
