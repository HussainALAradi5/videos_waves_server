import type { User } from './user.interface'

/** The user fields loaded when another model populates its user reference. */
export type PublicUserSource = Pick<User, '_id' | 'userName' | 'avatarUrl' | 'gender'>
