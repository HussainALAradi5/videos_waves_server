import type { MediaKind } from '../../../enums/media/media/media-kind.enum'

export interface MediaResponseDto {
  id: string
  code: string
  kind: MediaKind
  /** Public CDN URL, or a signed URL that expires for private media. */
  url: string
  thumbnailUrl: string | null
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  durationSeconds: number | null
  originalName: string
}
