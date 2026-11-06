import { MEDIA_TTL } from '../../../constants/media/media/media.constants'
import { mediaStorage } from '../../../globals/media/media-storage.globals'
import { mediaRepository } from '../../../repositories/media/media/media.repository'
import { logger } from '../../../utilities/logging/logger.utility'

const HOUR_MS = 60 * 60 * 1000

/**
 * Deletes provider files for soft-deleted media. Best effort: a failure is logged and the record
 * stays without `providerDeletedAt`, so `npm run media:cleanup` retries it later.
 */
export const purgeProviderFiles = async (mediaIds?: string[]): Promise<number> => {
  const targets = await mediaRepository.findAwaitingProviderDelete(mediaIds)
  let purged = 0
  for (const media of targets) {
    try {
      if (media.fileId) await mediaStorage.deleteFile(media.fileId)
      await mediaRepository.markProviderDeleted(media._id.toString())
      purged += 1
    } catch (error) {
      logger.error('Media provider delete failed', {
        mediaId: media._id.toString(),
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
  return purged
}

/** Removes uploads that were registered but never used within MEDIA_TTL.PENDING_HOURS. */
export const removeStaleUploads = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - MEDIA_TTL.PENDING_HOURS * HOUR_MS)
  const stale = await mediaRepository.findStalePending(cutoff)
  const ids = stale.map((media) => media._id.toString())
  await mediaRepository.softDeleteMany(ids, null)
  return ids.length
}
