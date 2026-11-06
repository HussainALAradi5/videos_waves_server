import { Role } from '../../../enums/users/roles/role.enum'

/** One development account per role. Passwords come from the environment or are generated. */
export const SEED_USERS = [
  { role: Role.ADMIN, userName: 'admin', email: 'admin@videos-waves.test', passwordEnv: 'SEED_ADMIN_PASSWORD' },
  { role: Role.USER, userName: 'viewer', email: 'viewer@videos-waves.test', passwordEnv: 'SEED_USER_PASSWORD' }
] as const

export const SEED_CREDENTIALS_FILE = '.seed-credentials.local.json'
