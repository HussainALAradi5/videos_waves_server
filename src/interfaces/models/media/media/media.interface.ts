import type { Types } from 'mongoose'
import type { MediaKind } from '../../../../enums/media/media/media-kind.enum'
import type { MediaProvider } from '../../../../enums/media/media/media-provider.enum'
import type { MediaStatus } from '../../../../enums/media/media/media-status.enum'
import type { MediaVisibility } from '../../../../enums/media/media/media-visibility.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface Media extends BaseEntity {
  kind: MediaKind
  provider: MediaProvider
  visibility: MediaVisibility
  status: MediaStatus
  /** Provider file id; null for external URLs. */
  fileId: string | null
  /** Provider path used to build delivery URLs; for external media, the full URL. */
  filePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  durationSeconds: number | null
  owner: Types.ObjectId
  /** Set once the provider file is gone; soft-deleted media without it are retried by the cleanup job. */
  providerDeletedAt: Date | null
}
