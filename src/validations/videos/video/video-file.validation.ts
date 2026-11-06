import { VIDEO_MIME_PREFIX } from '../../../constants/videos/video/video.constants'

export const isVideoMimeType = (mimeType: string): boolean => mimeType.startsWith(VIDEO_MIME_PREFIX)
