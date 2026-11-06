import { MEDIA_MIME_PREFIX, MEDIA_TTL } from '../../../constants/media/media/media.constants'
import { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'
import type { MediaResponseDto } from '../../../dtos/media/media/media-response.dto'
import type { Media } from '../../../interfaces/models/media/media/media.interface'
import { mediaStorage } from '../../../globals/media/media-storage.globals'

/** Builds delivery URLs at read time, so private links are always freshly signed and short-lived. */
export const toMediaResponse = (media: Media): MediaResponseDto => {
  const isPrivate = media.visibility === MediaVisibility.PRIVATE
  const isExternal = media.provider === MediaProvider.EXTERNAL
  const ttl = MEDIA_TTL.SIGNED_URL_SECONDS
  const isVideo = media.mimeType.startsWith(MEDIA_MIME_PREFIX.VIDEO)
  return {
    id: media._id.toString(),
    code: media.code,
    kind: media.kind,
    url: isExternal ? media.filePath : mediaStorage.buildUrl(media.filePath, isPrivate, ttl),
    thumbnailUrl: isVideo && !isExternal ? mediaStorage.buildThumbnailUrl(media.filePath, isPrivate, ttl) : null,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    width: media.width,
    height: media.height,
    durationSeconds: media.durationSeconds,
    originalName: media.originalName,
    createdAt: media.createdAt.toISOString()
  }
}
