import type { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'

export interface MediaRule {
  mimeTypes: readonly string[]
  maxBytes: number
  visibility: MediaVisibility
}
