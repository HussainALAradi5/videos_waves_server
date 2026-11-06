import type { BaseEntityResponseDto } from '../../common/base/base-entity-response.dto'
import type { PublicUserResponseDto } from '../../users/user/public-user-response.dto'

export interface VideoResponseDto extends BaseEntityResponseDto {
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string | null
  mimeType: string
  durationSeconds: number | null
  owner: PublicUserResponseDto
  likesCount: number
  commentsCount: number
  viewsCount: number
  isLiked: boolean
  updatedAt: string
}
