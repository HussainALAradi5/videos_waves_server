import type { PublicUserResponseDto } from '../../users/user/public-user-response.dto'

export interface VideoResponseDto {
  id: string
  code: string
  title: string
  description: string
  videoUrl: string
  mimeType: string
  owner: PublicUserResponseDto
  likesCount: number
  commentsCount: number
  viewsCount: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
}
