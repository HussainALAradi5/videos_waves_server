import type { Request, Response } from 'express'
import type { NotificationParamsDto } from '../../../dtos/notifications/notification/notification-params.dto'
import type { NotificationQueryDto } from '../../../dtos/notifications/notification/notification-query.dto'
import * as notificationService from '../../../services/notifications/notification/notification.service'
import { getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'
import { sendPage, sendSuccess } from '../../../utilities/responses/response.utility'

export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await notificationService.listNotifications(getQuery<NotificationQueryDto>(req), requireUser(req)))
}

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await notificationService.getUnreadCount(requireUser(req)))
}

export const markRead = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await notificationService.markNotificationRead(getParams<NotificationParamsDto>(req).notificationId, requireUser(req)))
}

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await notificationService.markAllNotificationsRead(requireUser(req)))
}
