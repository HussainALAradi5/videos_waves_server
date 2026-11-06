import { MediaKind } from '../../../enums/media/media/media-kind.enum'
import { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'
import type { MediaRule } from '../../../interfaces/media/storage/media-rule.interface'
import { BYTES_PER_MEGABYTE } from '../../common/limits.constants'

export const MEDIA_CODE_PREFIX = 'MED'

/** Every uploaded file lives under this root, then `<kind>/<userId>/`. */
export const MEDIA_FOLDER_ROOT = '/videos-waves'

export const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'
export const IMAGEKIT_THUMBNAIL_SUFFIX = '/ik-thumbnail.jpg'

export const MEDIA_TTL = {
  /** Upload signatures; ImageKit rejects anything over one hour. */
  SIGNATURE_SECONDS: 30 * 60,
  /** Signed delivery URLs for private files. */
  SIGNED_URL_SECONDS: 60 * 60,
  /** Registered but unused uploads are removed by the cleanup job after this. */
  PENDING_HOURS: 24
} as const

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
// ImageKit can report a browser-recorded .webm voice note as video/webm, so it is accepted for voice notes too.
const AUDIO_TYPES = ['audio/webm', 'video/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/x-m4a']

/**
 * Per-kind upload rules. Sizes follow the ImageKit free plan (100 MB video, 25 MB other files).
 * VIDEO's size is overridden from UPLOAD_MAX_VIDEO_MB in storage.config.
 */
export const MEDIA_RULES: Record<MediaKind, MediaRule> = {
  [MediaKind.VIDEO]: {
    mimeTypes: VIDEO_TYPES,
    maxBytes: 100 * BYTES_PER_MEGABYTE,
    visibility: MediaVisibility.PUBLIC
  },
  [MediaKind.AVATAR]: { mimeTypes: IMAGE_TYPES, maxBytes: 5 * BYTES_PER_MEGABYTE, visibility: MediaVisibility.PUBLIC },
  [MediaKind.CHAT_ATTACHMENT]: {
    mimeTypes: [...IMAGE_TYPES, ...VIDEO_TYPES, 'application/pdf'],
    maxBytes: 25 * BYTES_PER_MEGABYTE,
    visibility: MediaVisibility.PRIVATE
  },
  [MediaKind.VOICE_NOTE]: {
    mimeTypes: AUDIO_TYPES,
    maxBytes: 10 * BYTES_PER_MEGABYTE,
    visibility: MediaVisibility.PRIVATE
  }
}

export const MEDIA_UPLOAD_FIELD = 'file'
export const MEDIA_MIME_PREFIX = { VIDEO: 'video/', IMAGE: 'image/' } as const
export const LOCAL_MEDIA_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000
export const LOCAL_FILE_ID_PREFIX = 'local_'
