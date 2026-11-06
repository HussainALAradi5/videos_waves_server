import type { Types } from 'mongoose'
import { VideoLikeModel } from '../../../models/videos/video-like/video-like.model'
import type { VideoLike } from '../../../interfaces/models/videos/video-like/video-like.interface'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class VideoLikeRepository extends BaseRepository<VideoLike> {
  constructor() {
    super(VideoLikeModel)
  }

  /** Inserts the like when missing; returns true only when a new like was stored. */
  async likeOnce(videoId: string, userId: string): Promise<boolean> {
    const user = toObjectId(userId)
    const result = await this.model.updateOne(
      { video: toObjectId(videoId), user },
      { $setOnInsert: { createdBy: user, updatedBy: user } },
      { upsert: true }
    )
    return result.upsertedCount === 1
  }

  /** Removes the like; returns true only when a like existed. Likes are join rows, so they are hard-deleted. */
  async unlike(videoId: string, userId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ video: toObjectId(videoId), user: toObjectId(userId) })
    return result.deletedCount === 1
  }

  async isLiked(videoId: string, userId: string): Promise<boolean> {
    return (await this.model.exists({ video: toObjectId(videoId), user: toObjectId(userId) })) !== null
  }

  /** One query for a whole page of videos instead of one lookup per video. */
  async findLikedVideoIds(userId: string, videoIds: Types.ObjectId[]): Promise<Set<string>> {
    const likes = await this.model
      .find({ user: toObjectId(userId), video: { $in: videoIds } }, 'video')
      .lean()
    return new Set(likes.map((like) => like.video.toString()))
  }

  async removeAllForVideo(videoId: string): Promise<void> {
    await this.model.deleteMany({ video: toObjectId(videoId) })
  }
}

export const videoLikeRepository = new VideoLikeRepository()
