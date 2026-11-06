import { MESSAGES } from '../../../constants/common/messages.constants'
import type { MediaKind } from '../../../enums/media/media/media-kind.enum'
import { MediaStatus } from '../../../enums/media/media/media-status.enum'
import type { MediaResponseDto } from '../../../dtos/media/media/media-response.dto'
import type { RegisterMediaDto } from '../../../dtos/media/media/register-media.dto'
import type { UploadSignatureResponseDto } from '../../../dtos/media/media/upload-signature-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { mediaStorage } from '../../../globals/media/media-storage.globals'
import { mediaRepository } from '../../../repositories/media/media/media.repository'
import { toMediaResponse } from '../../../mappers/media/media/media.mapper'
import { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'
import { assertStoredFileAllowed, buildMediaFolder, getMediaRule } from '../../../validations/media/media/media-file.validation'
import { assertCanManage } from '../../../validations/common/ownership.validation'
import { badRequest, conflict, notFound } from '../../../utilities/errors/app-error.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { purgeProviderFiles } from './media-cleanup.service'

/** Step 1 of an upload: a short-lived signature plus the folder and rules for `kind`. */
export const createUploadSignature = (kind: MediaKind, actor: AuthUser): UploadSignatureResponseDto => {
  const rule = getMediaRule(kind)
  return {
    provider: mediaStorage.provider,
    uploadUrl: mediaStorage.uploadUrl,
    publicKey: mediaStorage.publicKey,
    ...mediaStorage.createUploadSignature(),
    folder: buildMediaFolder(kind, actor.id),
    isPrivateFile: rule.visibility === MediaVisibility.PRIVATE,
    maxBytes: rule.maxBytes,
    mimeTypes: rule.mimeTypes
  }
}

/**
 * Step 3 of an upload: reads the file back from the provider and records it as pending media.
 * A file that breaks the rules is deleted from the provider so it cannot linger or be reused.
 */
export const registerMedia = async (dto: RegisterMediaDto, actor: AuthUser): Promise<MediaResponseDto> => {
  if (await mediaRepository.findByProviderFile(mediaStorage.provider, dto.fileId)) {
    throw conflict(MESSAGES.MEDIA.ALREADY_USED)
  }
  const file = await mediaStorage.getFile(dto.fileId)
  if (!file) throw notFound(MESSAGES.MEDIA.FILE_NOT_UPLOADED)
  try {
    assertStoredFileAllowed(file, dto.kind, actor.id)
  } catch (error) {
    await mediaStorage.deleteFile(dto.fileId)
    throw error
  }
  const media = await mediaRepository.create(
    {
      kind: dto.kind,
      provider: mediaStorage.provider,
      visibility: getMediaRule(dto.kind).visibility,
      fileId: file.fileId,
      filePath: file.filePath,
      originalName: dto.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      width: file.width,
      height: file.height,
      durationSeconds: file.durationSeconds,
      owner: toObjectId(actor.id)
    },
    actor.id
  )
  return toMediaResponse(media)
}

/** Lets the uploader discard a pending upload (e.g. removed from the picker before sending). */
export const deletePendingMedia = async (mediaId: string, actor: AuthUser): Promise<void> => {
  const media = await mediaRepository.findById(mediaId)
  if (!media) throw notFound(MESSAGES.MEDIA.NOT_FOUND)
  assertCanManage(media.owner, actor, false)
  if (media.status !== MediaStatus.PENDING) throw conflict(MESSAGES.MEDIA.ALREADY_USED)
  await mediaRepository.softDeleteById(mediaId, actor.id)
  await purgeProviderFiles([mediaId])
}

/**
 * Claims the caller's pending uploads for one use (a video, an avatar, a message). Call inside the
 * transaction that creates the owning record, so a failed save leaves the media pending.
 */
export const claimMedia = async (mediaIds: string[], kind: MediaKind, actor: AuthUser) => {
  const unique = [...new Set(mediaIds)]
  const items = await mediaRepository.findOwnedPending(unique, actor.id, kind)
  if (items.length !== unique.length) throw badRequest(MESSAGES.MEDIA.WRONG_KIND)
  if ((await mediaRepository.markAttached(unique, actor.id)) !== unique.length) {
    throw conflict(MESSAGES.MEDIA.ALREADY_USED)
  }
  return items
}

/** Soft-deletes media inside the caller's transaction; call purgeProviderFiles after it commits. */
export const releaseMedia = (mediaIds: string[], actorId: string | null): Promise<void> =>
  mediaRepository.softDeleteMany(mediaIds, actorId)
