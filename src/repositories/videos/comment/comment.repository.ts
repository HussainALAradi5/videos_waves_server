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

  async softDeleteAllForVideo(videoId: string, actorId: string): Promise<void> {
    const actor = toObjectId(actorId)
    await this.model.updateMany(this.active({ video: toObjectId(videoId) }), {
      $set: { deletedAt: new Date(), deletedBy: actor, updatedBy: actor }
    })
  }
}

export const commentRepository = new CommentRepository()
