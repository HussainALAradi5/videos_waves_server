import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as videoController from '../../../controllers/videos/video/video.controller'
import { createVideoSchema } from '../../../dtos/videos/video/create-video.dto'
import { updateVideoSchema } from '../../../dtos/videos/video/update-video.dto'
import { videoQuerySchema } from '../../../dtos/videos/video/video-query.dto'
import { videoParamsSchema } from '../../../dtos/videos/video/video-params.dto'
import { authenticate, optionalAuthenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'
import { videoUpload } from '../../../middlewares/uploads/video-upload.middleware'

const { ROOT, BY_ID, VIEWS, LIKE } = ROUTES.VIDEOS
const byId = validate({ params: videoParamsSchema })

export const videoRoutes = Router()

videoRoutes.get(ROOT, optionalAuthenticate, validate({ query: videoQuerySchema }), videoController.listVideos)
videoRoutes.post(ROOT, authenticate, videoUpload, validate({ body: createVideoSchema }), videoController.uploadVideo)
videoRoutes.get(BY_ID, optionalAuthenticate, byId, videoController.getVideo)
videoRoutes.patch(
  BY_ID,
  authenticate,
  validate({ params: videoParamsSchema, body: updateVideoSchema }),
  videoController.updateVideo
)
videoRoutes.delete(BY_ID, authenticate, byId, videoController.deleteVideo)
videoRoutes.post(VIEWS, byId, videoController.recordView)
videoRoutes.put(LIKE, authenticate, byId, videoController.likeVideo)
videoRoutes.delete(LIKE, authenticate, byId, videoController.unlikeVideo)
