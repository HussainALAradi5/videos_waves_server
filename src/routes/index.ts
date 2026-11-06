import { Router } from 'express'
import { ROUTES } from '../constants/common/routes.constants'
import { sendSuccess } from '../utilities/responses/response.utility'
import { authRoutes } from './users/auth/auth.routes'
import { userRoutes } from './users/user/user.routes'
import { adminRequestRoutes } from './users/admin-request/admin-request.routes'
import { videoRoutes } from './videos/video/video.routes'
import { commentRoutes } from './videos/comment/comment.routes'
import { mediaRoutes } from './media/media/media.routes'

export const apiRoutes = Router()

apiRoutes.get(ROUTES.HEALTH, (_req, res) => sendSuccess(res, { status: 'ok' }))
apiRoutes.use(ROUTES.MEDIA.BASE, mediaRoutes)
apiRoutes.use(ROUTES.AUTH.BASE, authRoutes)
apiRoutes.use(ROUTES.USERS.BASE, userRoutes)
apiRoutes.use(ROUTES.ADMIN_REQUESTS.BASE, adminRequestRoutes)
// Comments mount before videos so /videos/:videoId/comments is not captured by /videos/:videoId.
apiRoutes.use(ROUTES.COMMENTS.BASE, commentRoutes)
apiRoutes.use(ROUTES.VIDEOS.BASE, videoRoutes)
