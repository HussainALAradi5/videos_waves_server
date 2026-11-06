import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as commentController from '../../../controllers/videos/comment/comment.controller'
import { commentBodySchema } from '../../../dtos/videos/comment/comment-body.dto'
import { commentQuerySchema } from '../../../dtos/videos/comment/comment-query.dto'
import { commentParamsSchema } from '../../../dtos/videos/comment/comment-params.dto'
import { createCommentSchema } from '../../../dtos/videos/comment/create-comment.dto'
import { videoParamsSchema } from '../../../dtos/videos/video/video-params.dto'
import { authenticate, optionalAuthenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'

const { ROOT, BY_ID, REPLIES, RESTORE, APPROVE } = ROUTES.COMMENTS
const byId = validate({ params: commentParamsSchema })

// mergeParams exposes :videoId from the parent mount path.
export const commentRoutes = Router({ mergeParams: true })

commentRoutes.get(
  ROOT,
  optionalAuthenticate,
  validate({ params: videoParamsSchema, query: commentQuerySchema }),
  commentController.listComments
)
commentRoutes.post(
  ROOT,
  authenticate,
  validate({ params: videoParamsSchema, body: createCommentSchema }),
  commentController.createComment
)
commentRoutes.get(
  REPLIES,
  optionalAuthenticate,
  validate({ params: commentParamsSchema, query: commentQuerySchema }),
  commentController.listReplies
)
commentRoutes.patch(
  BY_ID,
  authenticate,
  validate({ params: commentParamsSchema, body: commentBodySchema }),
  commentController.updateComment
)
commentRoutes.delete(BY_ID, authenticate, byId, commentController.deleteComment)
commentRoutes.patch(RESTORE, authenticate, byId, commentController.restoreComment)
commentRoutes.patch(APPROVE, authenticate, byId, commentController.approveComment)
