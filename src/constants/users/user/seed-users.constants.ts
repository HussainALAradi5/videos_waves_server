import { Role } from '../../../enums/users/roles/role.enum'
import { Gender } from '../../../enums/users/user/gender.enum'

/**
 * Demo accounts, two admins and four users. Admins share SEED_ADMIN_PASSWORD and users share
 * SEED_USER_PASSWORD; in development a missing password is generated into SEED_CREDENTIALS_FILE.
 */
export const SEED_USERS = [
  { role: Role.ADMIN, userName: 'admin', email: 'admin@videos-waves.test', phone: '+15550100001', gender: Gender.FEMALE, bio: 'Keeping the waves friendly.' },
  { role: Role.ADMIN, userName: 'moderator', email: 'moderator@videos-waves.test', phone: '+15550100002', gender: Gender.MALE, bio: 'Reviews reports and admin requests.' },
  { role: Role.USER, userName: 'viewer', email: 'viewer@videos-waves.test', phone: '+15550100003', gender: Gender.MALE, bio: 'Short films and night lights.' },
  { role: Role.USER, userName: 'lina', email: 'lina@videos-waves.test', phone: '+15550100004', gender: Gender.FEMALE, bio: 'City walks and street food.' },
  { role: Role.USER, userName: 'omar', email: 'omar@videos-waves.test', phone: '+15550100005', gender: Gender.MALE, bio: 'Animation nerd.' },
  { role: Role.USER, userName: 'maya', email: 'maya@videos-waves.test', phone: '+15550100006', gender: Gender.FEMALE, bio: 'Flowers, slow motion, and calm.' }
] as const

/** Environment variable holding the shared password of each role. */
export const SEED_PASSWORD_ENV = { admin: 'SEED_ADMIN_PASSWORD', user: 'SEED_USER_PASSWORD' } as const

export const SEED_CREDENTIALS_FILE = '.seed-credentials.local.json'
