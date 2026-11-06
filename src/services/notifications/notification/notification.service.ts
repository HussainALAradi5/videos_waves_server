import { MESSAGES } from '../../../constants/common/messages.constants'
import type { NotificationQueryDto } from '../../../dtos/notifications/notification/notification-query.dto'
import type { NotificationResponseDto } from '../../../dtos/notifications/notification/notification-response.dto'
import { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import type { NotificationKind } from '../../../enums/notifications/notification/notification-kind.enum'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { Notification } from '../../../interfaces/models/notifications/notification/notification.interface'
import { toNotificationResponse } from '../../../mappers/notifications/notification/notification.mapper'
import { notificationRepository } from '../../../repositories/notifications/notification/notification.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { notFound } from '../../../utilities/errors/app-error.utility'
import { toObjectId, toOptionalObjectId } from '../../../utilities/ids/object-id.utility'
import { logger } from '../../../utilities/logging/logger.utility'
import { emitToUsers } from '../../chat/realtime/chat-events.service'
import { getHiddenUserIds } from '../../users/visibility/visibility.service'

export interface NotifyInput {
  userId: string
  kind: NotificationKind
  actorId: string | null
  targetId?: string | null
  subject?: string
}

const viewsFor = async (items: Notification[]): Promise<NotificationResponseDto[]> => {
  const actorIds = [...new Set(items.flatMap((item) => (item.actor ? [item.actor.toString()] : [])))]
  const actors = new Map((await userRepository.findPublicByIds(actorIds)).map((user) => [user._id.toString(), user]))
  return items.map((item) => toNotificationResponse(item, item.actor ? (actors.get(item.actor.toString()) ?? null) : null))
}

/**
 * Adds a notification to someone's bell and pushes it live (`notification:new`). Never for your own
 * actions. Best effort: call after the action's transaction commits; a failure is logged, never thrown.
 */
export const notify = async (input: NotifyInput): Promise<void> => {
  if (input.actorId && input.actorId === input.userId) return
  try {
    const created = await notificationRepository.create(
      {
        user: toObjectId(input.userId),
        kind: input.kind,
        actor: toOptionalObjectId(input.actorId),
        targetId: toOptionalObjectId(input.targetId ?? null),
        subject: (input.subject ?? '').slice(0, 120)
      },
      input.actorId
    )
    const [view] = await viewsFor([created.toObject()])
    emitToUsers([input.userId], ChatEvent.NOTIFICATION_NEW, view)
  } catch (error) {
    logger.error('Notification failed', { error: error instanceof Error ? error.message : String(error) })
  }
}

/** The bell, newest first; people hidden from the viewer (blocks, deactivated) are left out. */
export const listNotifications = async (query: NotificationQueryDto, actor: AuthUser): Promise<PageResult<NotificationResponseDto>> => {
  const hidden = (await getHiddenUserIds(actor.id)).map(toObjectId)
  const filter: Record<string, unknown> = { user: toObjectId(actor.id), actor: { $nin: hidden } }
  if (query.filter === 'unread') filter.readAt = null
  const page = await notificationRepository.paginate<Notification>(filter, query)
  return { items: await viewsFor(page.items), meta: page.meta }
}

export const getUnreadCount = async (actor: AuthUser): Promise<{ unreadCount: number }> => ({
  unreadCount: await notificationRepository.countUnread(actor.id, await getHiddenUserIds(actor.id))
})

export const markNotificationRead = async (notificationId: string, actor: AuthUser): Promise<NotificationResponseDto> => {
  const updated = await notificationRepository.markRead(notificationId, actor.id)
  if (!updated) throw notFound(MESSAGES.NOTIFICATIONS.NOT_FOUND)
  return (await viewsFor([updated]))[0]
}

export const markAllNotificationsRead = async (actor: AuthUser): Promise<{ updated: number }> => ({
  updated: await notificationRepository.markAllRead(actor.id)
})
