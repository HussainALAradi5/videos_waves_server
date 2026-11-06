import { storageConfig } from '../../config/storage/storage.config'
import { MediaProvider } from '../../enums/media/media/media-provider.enum'
import type { MediaStorage } from '../../interfaces/media/storage/media-storage.interface'
import { ImageKitStorageService } from '../../services/media/storage/imagekit-storage.service'
import { LocalStorageService } from '../../services/media/storage/local-storage.service'

/** The one storage adapter the whole app uses, chosen by MEDIA_PROVIDER at startup. */
export const localStorageService = new LocalStorageService()

export const mediaStorage: MediaStorage =
  storageConfig.provider === MediaProvider.IMAGEKIT ? new ImageKitStorageService() : localStorageService
