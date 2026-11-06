import type { HydratedDocument } from 'mongoose'
import type { MediaKind } from '../../../enums/media/media/media-kind.enum'
import { MediaProvider } from '../../../enums/media/media/media-provider.enum'
import { MediaStatus } from '../../../enums/media/media/media-status.enum'
import type { Media } from '../../../interfaces/models/media/media/media.interface'
import { MediaModel } from '../../../models/media/media/media.model'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class MediaRepository extends BaseRepository<Media> {
  constructor() {
    super(MediaModel)
  }

  findActiveByPath(filePath: string) {
    return this.model.findOne(this.active({ filePath }), 'visibility')
  }

  findByProviderFile(provider: MediaProvider, fileId: string) {
    return this.model.findOne({ provider, fileId })
  }

  /** The caller's unused uploads of one kind, in the order of `mediaIds`; missing ids are skipped. */
  async findOwnedPending(mediaIds: string[], ownerId: string, kind: MediaKind): Promise<HydratedDocument<Media>[]> {
    const items = await this.model.find(
      this.active({
        _id: { $in: mediaIds.map(toObjectId) },
        owner: toObjectId(ownerId),
        kind,
        status: MediaStatus.PENDING
      })
    )
    const byId = new Map(items.map((item) => [item._id.toString(), item]))
    return mediaIds.flatMap((id) => byId.get(id) ?? [])
  }

  /** Atomically claims pending media; returns how many moved to attached (fewer means a race was lost). */
  async markAttached(mediaIds: string[], actorId: string): Promise<number> {
    const result = await this.model.updateMany(
      this.active({ _id: { $in: mediaIds.map(toObjectId) }, status: MediaStatus.PENDING }),
      { $set: { status: MediaStatus.ATTACHED, updatedBy: toObjectId(actorId) } }
    )
    return result.modifiedCount
  }

  async softDeleteMany(mediaIds: string[], actorId: string | null): Promise<void> {
    if (mediaIds.length === 0) return
    const actor = actorId ? toObjectId(actorId) : null
    await this.model.updateMany(this.active({ _id: { $in: mediaIds.map(toObjectId) } }), {
      $set: { deletedAt: new Date(), deletedBy: actor, updatedBy: actor }
    })
  }

  /** Uploads that were registered but never attached before `cutoff`. */
  findStalePending(cutoff: Date) {
    return this.model.find(this.active({ status: MediaStatus.PENDING, createdAt: { $lt: cutoff } }))
  }

  /** Soft-deleted media whose provider file still has to be removed, optionally limited to `mediaIds`. */
  findAwaitingProviderDelete(mediaIds?: string[]) {
    return this.model.find({
      ...(mediaIds ? { _id: { $in: mediaIds.map(toObjectId) } } : {}),
      deletedAt: { $ne: null },
      providerDeletedAt: null,
      provider: { $ne: MediaProvider.EXTERNAL }
    })
  }

  async markProviderDeleted(mediaId: string): Promise<void> {
    await this.model.updateOne({ _id: toObjectId(mediaId) }, { $set: { providerDeletedAt: new Date() } })
  }
}

export const mediaRepository = new MediaRepository()
