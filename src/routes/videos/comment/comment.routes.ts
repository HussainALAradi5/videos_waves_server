import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as commentController from '../../../controllers/videos/comment/comment.controller'
import { commentBodySchema } from '../../../dtos/videos/comment/comment-body.dto'
import { commentQuerySchema } from '../../../dtos/videos/comment/comment-query.dto'
import { commentParamsSchema } from '../../../dtos/videos/comment/comment-params.dto'
import { videoParamsSchema } from '../../../dtos/videos/video/video-params.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'

const { ROOT, BY_ID } = ROUTES.COMMENTS

// mergeParams exposes :videoId from the parent mount path.
export const commentRoutes = Router({ mergeParams: true })

commentRoutes.get(ROOT, validate({ params: videoParamsSchema, query: commentQuerySchema }), commentController.listComments)
commentRoutes.post(
  ROOT,
  authenticate,
  validate({ params: videoParamsSchema, body: commentBodySchema }),
  commentController.createComment
)
commentRoutes.patch(
  BY_ID,
  authenticate,
  validate({ params: commentParamsSchema, body: commentBodySchema }),
  commentController.updateComment
)
commentRoutes.delete(BY_ID, authenticate, validate({ params: commentParamsSchema }), commentController.deleteComment)
