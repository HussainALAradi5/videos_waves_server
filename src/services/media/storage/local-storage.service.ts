import { randomUUID } from 'crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'fs/promises'
import path from 'path'
import { storageConfig } from '../../../config/storage/storage.config'
import { ROUTES } from '../../../constants/common/routes.constants'
import { LOCAL_FILE_ID_PREFIX, MEDIA_TTL } from '../../../constants/media/media/media.constants'
import { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import type { LocalUploadDto } from '../../../dtos/media/media/local-upload.dto'
import type { MediaStorage } from '../../../interfaces/media/storage/media-storage.interface'
import type { StoredFile } from '../../../interfaces/media/storage/stored-file.interface'
import type { UploadSignature } from '../../../interfaces/media/storage/upload-signature.interface'
import { hmacSha1, isSameSignature, nowInSeconds } from '../../../utilities/security/hmac.utility'

const INDEX_FOLDER = '.index'
const SAFE_EXTENSION = /^\.[a-z0-9]{1,5}$/

/**
 * Offline adapter with the same contract as ImageKit: signed uploads, private signed URLs, and a
 * JSON index per file. For development and tests only; never point production at it.
 */
export class LocalStorageService implements MediaStorage {
  readonly provider = MediaProvider.LOCAL
  readonly uploadUrl = `${storageConfig.publicBaseUrl}${ROUTES.MEDIA.BASE}${ROUTES.MEDIA.LOCAL_UPLOAD}`
  readonly publicKey = MediaProvider.LOCAL
  private readonly root = storageConfig.local.directory
  private readonly secret = storageConfig.local.secret

  createUploadSignature(): UploadSignature {
    const token = randomUUID()
    const expire = nowInSeconds() + MEDIA_TTL.SIGNATURE_SECONDS
    return { token, expire, signature: hmacSha1(this.secret, `${token}${expire}`) }
  }

  isValidUploadSignature(dto: Pick<LocalUploadDto, 'token' | 'expire' | 'signature'>): boolean {
    if (dto.expire < nowInSeconds()) return false
    return isSameSignature(hmacSha1(this.secret, `${dto.token}${dto.expire}`), dto.signature)
  }

  /** Moves a temporary upload into `folder` and records it in the index, as ImageKit would. */
  async saveUpload(tempPath: string, dto: LocalUploadDto, mimeType: string, sizeBytes: number): Promise<StoredFile> {
    const id = randomUUID()
    const extension = path.extname(dto.fileName).toLowerCase()
    const filePath = `${dto.folder}/${id}${SAFE_EXTENSION.test(extension) ? extension : ''}`
    await mkdir(path.dirname(this.diskPath(filePath)), { recursive: true })
    await rename(tempPath, this.diskPath(filePath))
    const stored: StoredFile = {
      fileId: `${LOCAL_FILE_ID_PREFIX}${id}`,
      filePath,
      url: this.buildUrl(filePath, dto.isPrivateFile, MEDIA_TTL.SIGNED_URL_SECONDS),
      mimeType,
      sizeBytes,
      isPrivate: dto.isPrivateFile,
      width: null,
      height: null,
      durationSeconds: null
    }
    await mkdir(path.join(this.root, INDEX_FOLDER), { recursive: true })
    await writeFile(this.indexPath(stored.fileId), JSON.stringify(stored))
    return stored
  }

  async getFile(fileId: string): Promise<StoredFile | null> {
    if (!fileId.startsWith(LOCAL_FILE_ID_PREFIX)) return null
    try {
      return JSON.parse(await readFile(this.indexPath(fileId), 'utf8')) as StoredFile
    } catch {
      return null
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.getFile(fileId)
    if (!file) return
    await rm(this.diskPath(file.filePath), { force: true })
    await rm(this.indexPath(fileId), { force: true })
  }

  buildUrl(filePath: string, isPrivate: boolean, expiresInSeconds: number): string {
    const url = `${storageConfig.publicBaseUrl}${ROUTES.MEDIA.BASE}${ROUTES.MEDIA.LOCAL_FILES}${filePath}`
    if (!isPrivate) return url
    const expires = nowInSeconds() + expiresInSeconds
    return `${url}?expires=${expires}&signature=${hmacSha1(this.secret, `${filePath}${expires}`)}`
  }

  buildThumbnailUrl(): null {
    return null
  }

  isValidDeliverySignature(filePath: string, expires: number, signature: string): boolean {
    if (!Number.isFinite(expires) || expires < nowInSeconds()) return false
    return isSameSignature(hmacSha1(this.secret, `${filePath}${expires}`), signature)
  }

  /** Absolute path on disk; callers pass only validated folder paths, and `send` re-checks the root. */
  diskPath(filePath: string): string {
    return path.join(this.root, filePath)
  }

  get rootDirectory(): string {
    return this.root
  }

  private indexPath(fileId: string): string {
    return path.join(this.root, INDEX_FOLDER, `${path.basename(fileId)}.json`)
  }
}
