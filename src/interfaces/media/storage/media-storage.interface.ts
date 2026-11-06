import type { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import type { StoredFile } from './stored-file.interface'
import type { UploadSignature } from './upload-signature.interface'

/** One adapter per storage provider. Services depend on this, never on a provider SDK. */
export interface MediaStorage {
  readonly provider: MediaProvider
  readonly uploadUrl: string
  readonly publicKey: string
  createUploadSignature(): UploadSignature
  getFile(fileId: string): Promise<StoredFile | null>
  deleteFile(fileId: string): Promise<void>
  /** A delivery URL for `filePath`; private files get a signature that expires after `expiresInSeconds`. */
  buildUrl(filePath: string, isPrivate: boolean, expiresInSeconds: number): string
  buildThumbnailUrl(filePath: string, isPrivate: boolean, expiresInSeconds: number): string | null
}
