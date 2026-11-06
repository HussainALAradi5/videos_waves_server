import type { NotificationKind } from '../../../enums/notifications/notification/notification-kind.enum'
import type { PublicUserResponseDto } from '../../users/user/public-user-response.dto'

export interface NotificationResponseDto {
  id: string
  kind: NotificationKind
  actor: PublicUserResponseDto | null
  /** Ready-to-show text, for example "lina started following you". */
  message: string
  /** In-app path to open, the same on web and mobile (`/u/lina`, `/videos/<id>`). */
  link: string
  isRead: boolean
  createdAt: string
}
