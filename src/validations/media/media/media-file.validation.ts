import { storageConfig } from '../../../config/storage/storage.config'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { MEDIA_FOLDER_ROOT, MEDIA_RULES } from '../../../constants/media/media/media.constants'
import { ErrorCode } from '../../../enums/common/error-code.enum'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'
import { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'
import type { MediaRule } from '../../../interfaces/media/storage/media-rule.interface'
import type { StoredFile } from '../../../interfaces/media/storage/stored-file.interface'
import { AppError, badRequest, forbidden } from '../../../utilities/errors/app-error.utility'

/** The upload rule for `kind`, with the video size taken from configuration. */
export const getMediaRule = (kind: MediaKind): MediaRule =>
  kind === MediaKind.VIDEO ? { ...MEDIA_RULES[kind], maxBytes: storageConfig.maxVideoBytes } : MEDIA_RULES[kind]

export const buildMediaFolder = (kind: MediaKind, ownerId: string): string => `${MEDIA_FOLDER_ROOT}/${kind}/${ownerId}`

const folderOf = (filePath: string): string => filePath.slice(0, filePath.lastIndexOf('/'))

/**
 * The client chooses the folder, privacy flag, and file during a direct upload, so nothing it
 * uploaded is trusted until the provider's own record of the file passes these checks.
 */
export const assertStoredFileAllowed = (file: StoredFile, kind: MediaKind, ownerId: string): void => {
  const rule = getMediaRule(kind)
  if (folderOf(file.filePath) !== buildMediaFolder(kind, ownerId)) throw forbidden(MESSAGES.MEDIA.WRONG_FOLDER)
  if (file.isPrivate !== (rule.visibility === MediaVisibility.PRIVATE)) {
    throw badRequest(MESSAGES.MEDIA.WRONG_VISIBILITY)
  }
  if (!rule.mimeTypes.includes(file.mimeType)) {
    throw new AppError(ErrorCode.UNSUPPORTED_MEDIA_TYPE, MESSAGES.MEDIA.TYPE_NOT_ALLOWED)
  }
  if (file.sizeBytes > rule.maxBytes) throw new AppError(ErrorCode.PAYLOAD_TOO_LARGE, MESSAGES.MEDIA.TOO_LARGE)
}
