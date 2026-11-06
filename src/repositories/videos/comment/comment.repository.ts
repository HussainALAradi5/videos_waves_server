import { CommentModel } from '../../../models/videos/comment/comment.model'
import type { Comment } from '../../../interfaces/models/videos/comment/comment.interface'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class CommentRepository extends BaseRepository<Comment> {
  constructor() {
    super(CommentModel)
  }

  findInVideo(videoId: string, commentId: string) {
    return this.model.findOne(this.active({ _id: toObjectId(commentId), video: toObjectId(videoId) }))
  }

  /** A soft-deleted comment of this video, for undo. */
  findDeletedInVideo(videoId: string, commentId: string) {
    return this.model.findOne({ _id: toObjectId(commentId), video: toObjectId(videoId), deletedAt: { $ne: null } })
  }

  /** Soft-deletes a comment and its replies with one shared timestamp, so undo can restore exactly that thread. */
  async softDeleteThread(commentId: string, actorId: string, deletedAt: Date): Promise<void> {
    const actor = toObjectId(actorId)
    const id = toObjectId(commentId)
    await this.model.updateMany(this.active({ $or: [{ _id: id }, { parent: id }] }), {
      $set: { deletedAt, deletedBy: actor, updatedBy: actor }
    })
  }

  async restoreThread(commentId: string, deletedAt: Date, actorId: string): Promise<void> {
    const id = toObjectId(commentId)
    await this.model.updateMany(
      { $or: [{ _id: id }, { parent: id }], deletedAt },
      { $set: { deletedAt: null, deletedBy: null, updatedBy: toObjectId(actorId) } }
    )
  }

  async softDeleteAllForVideo(videoId: string, actorId: string): Promise<void> {
    const actor = toObjectId(actorId)
    await this.model.updateMany(this.active({ video: toObjectId(videoId) }), {
      $set: { deletedAt: new Date(), deletedBy: actor, updatedBy: actor }
    })
  }
}

export const commentRepository = new CommentRepository()
