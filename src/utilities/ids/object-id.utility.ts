import { Types } from 'mongoose'

export const toObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id)

export const toOptionalObjectId = (id: string | null | undefined): Types.ObjectId | null =>
  id ? new Types.ObjectId(id) : null

export const isSameId = (left: Types.ObjectId | string | null | undefined, right: string): boolean =>
  left !== null && left !== undefined && left.toString() === right
