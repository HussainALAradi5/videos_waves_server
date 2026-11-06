import type { Migration } from '../interfaces/migrations/migration.interface'
import { legacySchemaMigration } from './001-legacy-schema.migration'
import { syncIndexesMigration } from './002-sync-indexes.migration'
import { caseInsensitiveUserNamesMigration } from './003-case-insensitive-usernames.migration'

/** Every migration, in the order it must run. Append new ones; never reorder or edit applied ones. */
export const MIGRATIONS: readonly Migration[] = [legacySchemaMigration, syncIndexesMigration, caseInsensitiveUserNamesMigration]
