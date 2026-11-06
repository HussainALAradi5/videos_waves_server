import type { Types } from 'mongoose'
import { Role } from '../../enums/users/roles/role.enum'
import { MESSAGES } from '../../constants/common/messages.constants'
import type { AuthUser } from '../../interfaces/auth/auth-user.interface'
import { forbidden } from '../../utilities/errors/app-error.utility'
import { isSameId } from '../../utilities/ids/object-id.utility'

export const isOwner = (ownerId: Types.ObjectId, actor: AuthUser): boolean => isSameId(ownerId, actor.id)

/** Owners may always act; admins may act only when `allowAdmin` is true. */
export const assertCanManage = (ownerId: Types.ObjectId, actor: AuthUser, allowAdmin: boolean): void => {
  const isAllowed = isOwner(ownerId, actor) || (allowAdmin && actor.role === Role.ADMIN)
  if (!isAllowed) throw forbidden(MESSAGES.AUTH.FORBIDDEN)
}
