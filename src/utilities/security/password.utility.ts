import bcrypt from 'bcryptjs'
import { jwtConfig } from '../../config/auth/jwt.config'

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, jwtConfig.saltRounds)

export const comparePassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash)
