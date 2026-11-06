import type { NotificationResponseDto } from '../../../dtos/notifications/notification/notification-response.dto'
import { NotificationKind } from '../../../enums/notifications/notification/notification-kind.enum'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { Notification } from '../../../interfaces/models/notifications/notification/notification.interface'
import { toPublicUser } from '../../users/user/user.mapper'

const textFor = (kind: NotificationKind, name: string, subject: string): string => {
  switch (kind) {
    case NotificationKind.FOLLOW:
      return `${name} started following you`
    case NotificationKind.FOLLOW_REQUEST:
      return `${name} asked to follow you`
    case NotificationKind.FOLLOW_ACCEPTED:
      return `${name} accepted your follow request`
    case NotificationKind.LIKE:
      return `${name} liked your video "${subject}"`
    case NotificationKind.COMMENT:
      return `${name} commented on "${subject}"`
    case NotificationKind.REPLY:
      return `${name} replied to your comment on "${subject}"`
    case NotificationKind.GROUP_ADDED:
      return `${name} added you to "${subject}"`
    case NotificationKind.ADMIN_ACCEPTED:
      return 'Your admin request was accepted. Welcome to the team!'
    case NotificationKind.ADMIN_REJECTED:
      return 'Your admin request was not accepted this time.'
  }
}

const linkFor = (kind: NotificationKind, actorName: string, targetId: string | null): string => {
  switch (kind) {
    case NotificationKind.FOLLOW:
    case NotificationKind.FOLLOW_REQUEST:
    case NotificationKind.FOLLOW_ACCEPTED:
      return `/u/${encodeURIComponent(actorName)}`
    case NotificationKind.GROUP_ADDED:
      return `/messages/${targetId ?? ''}`
    case NotificationKind.ADMIN_ACCEPTED:
    case NotificationKind.ADMIN_REJECTED:
      return '/settings'
    default:
      return `/videos/${targetId ?? ''}`
  }
}

export const toNotificationResponse = (notification: Notification, actor: PublicUserSource | null): NotificationResponseDto => {
  const name = actor?.userName ?? 'Videos Waves'
  return {
    id: notification._id.toString(),
    kind: notification.kind,
    actor: actor ? toPublicUser(actor) : null,
    message: textFor(notification.kind, name, notification.subject),
    link: linkFor(notification.kind, name, notification.targetId?.toString() ?? null),
    isRead: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString()
  }
}
