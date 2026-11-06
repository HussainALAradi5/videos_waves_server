import { rm } from 'fs/promises'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { REGEX } from '../../../constants/common/regex.constants'
import { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'
import type { LocalUploadDto } from '../../../dtos/media/media/local-upload.dto'
import type { StoredFile } from '../../../interfaces/media/storage/stored-file.interface'
import { localStorageService, mediaStorage } from '../../../globals/media/media-storage.globals'
import { mediaRepository } from '../../../repositories/media/media/media.repository'
import { badRequest, forbidden, notFound, unauthorized } from '../../../utilities/errors/app-error.utility'

const assertLocalProvider = (): void => {
  if (mediaStorage.provider !== MediaProvider.LOCAL) throw forbidden(MESSAGES.MEDIA.LOCAL_PROVIDER_ONLY)
}

/** Stand-in for ImageKit's upload endpoint, so clients use one upload flow for both providers. */
export const saveLocalUpload = async (
  file: Express.Multer.File | undefined,
  dto: LocalUploadDto
): Promise<StoredFile> => {
  try {
    assertLocalProvider()
    if (!file) throw badRequest(MESSAGES.MEDIA.FILE_REQUIRED)
    if (!localStorageService.isValidUploadSignature(dto)) throw unauthorized(MESSAGES.MEDIA.UPLOAD_SIGNATURE_INVALID)
    return await localStorageService.saveUpload(file.path, dto, file.mimetype, file.size)
  } catch (error) {
    if (file) await rm(file.path, { force: true })
    throw error
  }
}

/**
 * Resolves a local file for delivery. Only files of active media are served, and files in private
 * folders also need a valid, unexpired delivery signature.
 */
export const resolveLocalFile = async (filePath: string, expires: number, signature: string): Promise<string> => {
  assertLocalProvider()
  if (!REGEX.LOCAL_MEDIA_PATH.test(filePath)) throw notFound(MESSAGES.MEDIA.NOT_FOUND)
  const media = await mediaRepository.findActiveByPath(filePath)
  if (!media) throw notFound(MESSAGES.MEDIA.NOT_FOUND)
  if (media.visibility === MediaVisibility.PRIVATE && !localStorageService.isValidDeliverySignature(filePath, expires, signature)) {
    throw forbidden(MESSAGES.MEDIA.DELIVERY_SIGNATURE_INVALID)
  }
  return filePath
}
