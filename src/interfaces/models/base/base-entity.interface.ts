import type { Types } from 'mongoose'

export interface BaseEntity {
  _id: Types.ObjectId
  code: string
  createdAt: Date
  updatedAt: Date
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  deletedAt: Date | null
  deletedBy: Types.ObjectId | null
}
