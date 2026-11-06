import ImageKit, { NotFoundError } from '@imagekit/nodejs'
import { storageConfig } from '../../../config/storage/storage.config'
import { IMAGEKIT_THUMBNAIL_SUFFIX, IMAGEKIT_UPLOAD_URL, MEDIA_TTL } from '../../../constants/media/media/media.constants'
import { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import type { MediaStorage } from '../../../interfaces/media/storage/media-storage.interface'
import type { StoredFile } from '../../../interfaces/media/storage/stored-file.interface'
import type { UploadSignature } from '../../../interfaces/media/storage/upload-signature.interface'
import { nowInSeconds } from '../../../utilities/security/hmac.utility'

/** ImageKit adapter: clients upload straight to ImageKit; we only sign, verify, deliver, and delete. */
export class ImageKitStorageService implements MediaStorage {
  readonly provider = MediaProvider.IMAGEKIT
  readonly uploadUrl = IMAGEKIT_UPLOAD_URL
  readonly publicKey = storageConfig.imageKit.publicKey
  private readonly client = new ImageKit({ privateKey: storageConfig.imageKit.privateKey })

  createUploadSignature(): UploadSignature {
    return this.client.helper.getAuthenticationParameters(undefined, nowInSeconds() + MEDIA_TTL.SIGNATURE_SECONDS)
  }

  async getFile(fileId: string): Promise<StoredFile | null> {
    try {
      const file = await this.client.files.get(fileId)
      if (!file.fileId || !file.filePath) return null
      return {
        fileId: file.fileId,
        filePath: file.filePath,
        url: file.url ?? '',
        mimeType: file.mime ?? '',
        sizeBytes: file.size ?? 0,
        isPrivate: file.isPrivateFile ?? false,
        width: file.width ?? null,
        height: file.height ?? null,
        durationSeconds: file.duration ?? null
      }
    } catch (error) {
      if (error instanceof NotFoundError) return null
      throw error
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.client.files.delete(fileId)
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error
    }
  }

  buildUrl(filePath: string, isPrivate: boolean, expiresInSeconds: number): string {
    return this.client.helper.buildSrc({
      urlEndpoint: storageConfig.imageKit.urlEndpoint,
      src: filePath,
      ...(isPrivate ? { signed: true, expiresIn: expiresInSeconds } : {})
    })
  }

  buildThumbnailUrl(filePath: string, isPrivate: boolean, expiresInSeconds: number): string {
    return this.buildUrl(`${filePath}${IMAGEKIT_THUMBNAIL_SUFFIX}`, isPrivate, expiresInSeconds)
  }
}
