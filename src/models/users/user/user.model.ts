import { Schema, model } from 'mongoose'
import { Role } from '../../../enums/users/roles/role.enum'
import { USER_CODE_PREFIX, USER_LIMITS } from '../../../constants/users/user/user.constants'
import type { User } from '../../../interfaces/models/users/user/user.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const userSchema = new Schema<User>({
  userName: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: USER_LIMITS.EMAIL_MAX
  },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(Role), default: Role.USER, index: true },
  image: { type: String, default: null, maxlength: USER_LIMITS.IMAGE_URL_MAX },
  tokenVersion: { type: Number, default: 0, select: false }
})

userSchema.plugin(baseEntityPlugin, { codePrefix: USER_CODE_PREFIX })

export const UserModel = model<User>('User', userSchema)
