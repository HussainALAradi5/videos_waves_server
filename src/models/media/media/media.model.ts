import { Schema, model } from 'mongoose'
import { MEDIA_CODE_PREFIX } from '../../../constants/media/media/media.constants'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'
import { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import { MediaStatus } from '../../../enums/media/media/media-status.enum'
import { MediaVisibility } from '../../../enums/media/media/media-visibility.enum'
import type { Media } from '../../../interfaces/models/media/media/media.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const mediaSchema = new Schema<Media>({
  kind: { type: String, enum: Object.values(MediaKind), required: true },
  provider: { type: String, enum: Object.values(MediaProvider), required: true },
  visibility: { type: String, enum: Object.values(MediaVisibility), required: true },
  status: { type: String, enum: Object.values(MediaStatus), default: MediaStatus.PENDING },
  fileId: { type: String, default: null },
  filePath: { type: String, required: true },
  originalName: { type: String, default: '', maxlength: 255 },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true, min: 0 },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  durationSeconds: { type: Number, default: null },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  providerDeletedAt: { type: Date, default: null }
})

mediaSchema.plugin(baseEntityPlugin, { codePrefix: MEDIA_CODE_PREFIX })
// One record per provider file, so the same upload can never be attached twice.
mediaSchema.index(
  { provider: 1, fileId: 1 },
  { unique: true, partialFilterExpression: { fileId: { $type: 'string' } } }
)
mediaSchema.index({ filePath: 1 })
mediaSchema.index({ owner: 1, status: 1 })
mediaSchema.index({ status: 1, createdAt: 1 })
mediaSchema.index({ deletedAt: 1, providerDeletedAt: 1 })

export const MediaModel = model<Media>('Media', mediaSchema)
