import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

/** One directed relation: the restricter limits what the restricted user can do. */
export interface Restriction extends BaseEntity {
  restricter: Types.ObjectId
  restricted: Types.ObjectId
}
