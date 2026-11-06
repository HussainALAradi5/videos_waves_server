import { z } from 'zod'
import { FeedScope } from '../../../enums/videos/video/feed-scope.enum'
import { VIDEO_SORT_FIELDS } from '../../../constants/videos/video/video.constants'
import { objectIdSchema } from '../../../validations/common/object-id.validation'
import { buildPageRequestSchema, searchSchema } from '../../../validations/common/pagination.validation'

export const videoQuerySchema = buildPageRequestSchema(VIDEO_SORT_FIELDS, 'createdAt').extend({
  search: searchSchema,
  ownerId: objectIdSchema.optional(),
  scope: z.enum(FeedScope).default(FeedScope.ALL)
})

export type VideoQueryDto = z.infer<typeof videoQuerySchema>
