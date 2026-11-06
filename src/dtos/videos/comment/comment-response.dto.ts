import type { PublicUserResponseDto } from '../../users/user/public-user-response.dto'

export interface CommentResponseDto {
  id: string
  code: string
  videoId: string
  parentId: string | null
  content: string
  author: PublicUserResponseDto
  /** The author owns the video: clients show an "Owner" badge. */
  isVideoOwner: boolean
  isEdited: boolean
  /** Visible only to its author and the video owner until the owner approves it. */
  isPendingApproval: boolean
  repliesCount: number
  createdAt: string
  updatedAt: string
}
