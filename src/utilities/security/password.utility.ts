import bcrypt from 'bcryptjs'
import { jwtConfig } from '../../config/auth/jwt.config'

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, jwtConfig.saltRounds)

export const comparePassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash)

/** Hashed once at startup with the real cost, so failed logins for unknown accounts take as long as real ones. */
export const TIMING_SAFE_DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', jwtConfig.saltRounds)
