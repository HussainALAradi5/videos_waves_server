import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as notificationController from '../../../controllers/notifications/notification/notification.controller'
import { notificationParamsSchema } from '../../../dtos/notifications/notification/notification-params.dto'
import { notificationQuerySchema } from '../../../dtos/notifications/notification/notification-query.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'

const N = ROUTES.NOTIFICATIONS

export const notificationRoutes = Router()

notificationRoutes.use(authenticate)
notificationRoutes.get(N.ROOT, validate({ query: notificationQuerySchema }), notificationController.listNotifications)
notificationRoutes.get(N.UNREAD_COUNT, notificationController.getUnreadCount)
notificationRoutes.patch(N.READ_ALL, notificationController.markAllRead)
notificationRoutes.patch(N.READ, validate({ params: notificationParamsSchema }), notificationController.markRead)
