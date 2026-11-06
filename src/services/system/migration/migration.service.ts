import '../../../models/register-models'
import { MIGRATIONS } from '../../../migrations'
import { migrationRepository } from '../../../repositories/system/migration/migration.repository'
import { logger } from '../../../utilities/logging/logger.utility'

/** Runs every migration that has not run yet, in order, recording each one. Returns the ids applied. */
export const runPendingMigrations = async (): Promise<string[]> => {
  const applied = await migrationRepository.findAppliedIds()
  const ran: string[] = []
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue
    logger.info(`Running migration ${migration.id}: ${migration.description}`)
    await migration.up()
    await migrationRepository.create(
      { migrationId: migration.id, description: migration.description, appliedAt: new Date() },
      null
    )
    ran.push(migration.id)
  }
  return ran
}
