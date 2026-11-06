import path from 'path'
import { env } from '../index'
import { BYTES_PER_MEGABYTE } from '../../constants/common/limits.constants'
import { MediaProvider } from '../../enums/media/media/media-provider.enum'

export const storageConfig = {
  provider: env.MEDIA_PROVIDER === 'imagekit' ? MediaProvider.IMAGEKIT : MediaProvider.LOCAL,
  imageKit: {
    publicKey: env.IMAGEKIT_PUBLIC_KEY ?? '',
    privateKey: env.IMAGEKIT_PRIVATE_KEY ?? '',
    urlEndpoint: (env.IMAGEKIT_URL_ENDPOINT ?? '').replace(/\/$/, '')
  },
  local: {
    directory: path.resolve(process.cwd(), env.MEDIA_LOCAL_DIR),
    secret: env.MEDIA_LOCAL_SECRET ?? ''
  },
  maxVideoBytes: env.UPLOAD_MAX_VIDEO_MB * BYTES_PER_MEGABYTE,
  publicBaseUrl: env.PUBLIC_BASE_URL.replace(/\/$/, '')
}
