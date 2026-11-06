import type { User } from '../../../interfaces/models/users/user/user.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { UserResponseDto } from '../../../dtos/users/user/user-response.dto'
import type { PublicUserResponseDto } from '../../../dtos/users/user/public-user-response.dto'

export const toUserResponse = (user: User): UserResponseDto => ({
  id: user._id.toString(),
  code: user.code,
  userName: user.userName,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  followersCount: user.followersCount,
  followingCount: user.followingCount,
  videosCount: user.videosCount,
  createdAt: user.createdAt.toISOString()
})

export const toPublicUser = (user: PublicUserSource): PublicUserResponseDto => ({
  id: user._id.toString(),
  userName: user.userName,
  avatarUrl: user.avatarUrl
})
