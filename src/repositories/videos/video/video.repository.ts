import { VideoModel } from '../../../models/videos/video/video.model'
import type { Video } from '../../../interfaces/models/videos/video/video.interface'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

export type VideoCounter = 'likesCount' | 'commentsCount' | 'viewsCount'

class VideoRepository extends BaseRepository<Video> {
  constructor() {
    super(VideoModel)
  }

  async incrementCounter(id: string, counter: VideoCounter, amount: number): Promise<void> {
    // Counters never drop below zero, even under concurrent decrements.
    const guard = amount < 0 ? { [counter]: { $gte: -amount } } : {}
    await this.model.updateOne({ _id: toObjectId(id), ...guard }, { $inc: { [counter]: amount } })
  }
}

export const videoRepository = new VideoRepository()
