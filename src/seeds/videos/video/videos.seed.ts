import { DEMO_VIDEOS } from '../../../constants/videos/video/demo-videos.constants'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'
import { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import { MediaStatus } from '../../../enums/media/media/media-status.enum'
import { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'
import { mediaRepository } from '../../../repositories/media/media/media.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { logger } from '../../../utilities/logging/logger.utility'

/** Adds the demo videos once (skipped when any video exists), using external media so nothing is uploaded. */
export const seedVideos = async (): Promise<number> => {
  if (await videoRepository.exists({})) return 0
  let created = 0
  for (const demo of DEMO_VIDEOS) {
    const owner = await userRepository.findByUserName(demo.ownerUserName)
    if (!owner) continue
    const ownerId = owner._id.toString()
    await withTransaction(async () => {
      const media = await mediaRepository.create(
        {
          kind: MediaKind.VIDEO,
          provider: MediaProvider.EXTERNAL,
          visibility: MediaVisibility.PUBLIC,
          status: MediaStatus.ATTACHED,
          filePath: demo.url,
          mimeType: demo.mimeType,
          sizeBytes: 0,
          owner: owner._id
        },
        ownerId
      )
      await videoRepository.create(
        { title: demo.title, description: demo.description, media: media._id, owner: owner._id },
        ownerId
      )
      await userRepository.incrementCounter(ownerId, 'videosCount', 1)
    })
    created += 1
  }
  logger.info(`Seeded ${created} demo videos`)
  return created
}
