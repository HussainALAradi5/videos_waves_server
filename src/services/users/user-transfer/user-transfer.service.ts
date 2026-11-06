import { randomBytes } from 'crypto'
import { Types } from 'mongoose'
import {
  USER_EXPORT_COLUMNS,
  USER_EXPORT_MAX_ROWS,
  USER_IMPORT_SKIP_REASONS
} from '../../../constants/users/user/user-transfer.constants'
import type { ImportUsersDto } from '../../../dtos/users/user/import-users.dto'
import type { ImportUsersResponseDto } from '../../../dtos/users/user/import-users-response.dto'
import type { UserQueryDto } from '../../../dtos/users/user/user-query.dto'
import { AccountStatus } from '../../../enums/users/user/account-status.enum'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toCsv } from '../../../utilities/files/csv.utility'
import { hashPassword } from '../../../utilities/security/password.utility'
import { buildUserListFilter } from '../user/user.service'

// Satisfies the password rule (upper, lower, digit); the person changes it after signing in.
const temporaryPassword = (): string => `Tw${randomBytes(9).toString('base64url')}7k`

/** The admin users list as CSV, with the same search and filters, capped at USER_EXPORT_MAX_ROWS. */
export const exportUsers = async (query: Omit<UserQueryDto, 'page' | 'pageSize'>): Promise<string> => {
  const users = await userRepository.findForExport(buildUserListFilter(query), USER_EXPORT_MAX_ROWS)
  const rows = users.map((user) => [
    user.code,
    user.userName,
    user.email,
    user.phone ?? '',
    user.role,
    user.gender ?? '',
    user.deactivatedAt ? AccountStatus.INACTIVE : AccountStatus.ACTIVE,
    user.videosCount,
    user.followersCount,
    user.followingCount,
    user.createdAt.toISOString()
  ])
  return toCsv(USER_EXPORT_COLUMNS, rows)
}

/**
 * Creates accounts from imported rows. Existing emails or usernames (including deactivated and
 * deleted accounts) are skipped, never overwritten. Each new account gets a temporary password that
 * is returned once; nothing about it is stored except its hash.
 */
export const importUsers = async (dto: ImportUsersDto, actor: AuthUser): Promise<ImportUsersResponseDto> => {
  const result: ImportUsersResponseDto = { created: [], skipped: [] }
  const seen = new Set<string>()
  for (const row of dto.rows) {
    const keys = [`e:${row.email.toLowerCase()}`, `u:${row.userName.toLowerCase()}`]
    const skip = (reason: string) => result.skipped.push({ userName: row.userName, email: row.email, reason })
    if (keys.some((key) => seen.has(key))) {
      skip(USER_IMPORT_SKIP_REASONS.DUPLICATE_IN_FILE)
      continue
    }
    keys.forEach((key) => seen.add(key))
    if (await userRepository.isEmailTaken(row.email)) {
      skip(USER_IMPORT_SKIP_REASONS.EMAIL_TAKEN)
      continue
    }
    if (row.phone && (await userRepository.isPhoneTaken(row.phone))) {
      skip(USER_IMPORT_SKIP_REASONS.PHONE_TAKEN)
      continue
    }
    if (await userRepository.isUserNameTaken(row.userName)) {
      skip(USER_IMPORT_SKIP_REASONS.USER_NAME_TAKEN)
      continue
    }
    const password = temporaryPassword()
    await userRepository.create(
      {
        _id: new Types.ObjectId(),
        userName: row.userName,
        email: row.email.toLowerCase(),
        phone: row.phone ?? null,
        gender: row.gender,
        role: row.role,
        passwordHash: await hashPassword(password)
      },
      actor.id
    )
    result.created.push({ userName: row.userName, email: row.email.toLowerCase(), role: row.role, temporaryPassword: password })
  }
  return result
}
