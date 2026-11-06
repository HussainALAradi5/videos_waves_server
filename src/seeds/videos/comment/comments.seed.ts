import { DEMO_COMMENTS } from '../../../constants/seeds/demo-content.constants'
import { commentRepository } from '../../../repositories/videos/comment/comment.repository'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { createComment } from '../../../services/videos/comment/comment.service'
import { logger } from '../../../utilities/logging/logger.utility'
import { actAs } from '../../common/seed-actor'

/** Adds the demo comments and owner replies once (skipped when any comment exists). */
export const seedComments = async (): Promise<void> => {
  if (await commentRepository.exists({})) return
  for (const demo of DEMO_COMMENTS) {
    const video = await videoRepository.findByTitle(demo.videoTitle)
    if (!video) continue
    const videoId = video._id.toString()
    const comment = await createComment(videoId, { content: demo.content }, await actAs(demo.author))
    for (const reply of demo.replies) {
      await createComment(videoId, { content: reply.content, parentId: comment.id }, await actAs(reply.author))
    }
  }
  logger.info('Seeded demo comments')
}
