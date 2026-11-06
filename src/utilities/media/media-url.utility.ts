import { storageConfig } from '../../config/storage/storage.config'
import { ROUTES } from '../../constants/common/routes.constants'

export const buildVideoUrl = (fileName: string): string =>
  `${storageConfig.publicBaseUrl}${ROUTES.MEDIA_VIDEOS}/${encodeURIComponent(fileName)}`
