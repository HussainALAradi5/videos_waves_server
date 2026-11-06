import type { PublicUserResponseDto } from '../../users/user/public-user-response.dto'

export interface CommentResponseDto {
  id: string
  code: string
  videoId: string
  content: string
  author: PublicUserResponseDto
  createdAt: string
  updatedAt: string
}
