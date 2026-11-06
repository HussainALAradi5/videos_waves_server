import path from 'path'
import { env } from '../index'
import { BYTES_PER_MEGABYTE } from '../../constants/common/limits.constants'

export const storageConfig = {
  videosDirectory: path.resolve(process.cwd(), env.STORAGE_VIDEOS_DIR),
  maxVideoBytes: env.UPLOAD_MAX_VIDEO_MB * BYTES_PER_MEGABYTE,
  publicBaseUrl: env.PUBLIC_BASE_URL.replace(/\/$/, '')
}
