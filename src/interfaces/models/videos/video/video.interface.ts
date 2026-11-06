import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface Video extends BaseEntity {
  title: string
  description: string
  fileName: string
  mimeType: string
  sizeBytes: number
  owner: Types.ObjectId
  likesCount: number
  commentsCount: number
  viewsCount: number
}
