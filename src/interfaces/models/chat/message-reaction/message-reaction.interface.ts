import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface MessageReaction extends BaseEntity {
  message: Types.ObjectId
  conversation: Types.ObjectId
  user: Types.ObjectId
  emoji: string
}
