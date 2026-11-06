import { VideoModel } from '../../../models/videos/video/video.model'
import type { Video } from '../../../interfaces/models/videos/video/video.interface'
import { BaseRepository } from '../../base/base.repository'

class VideoRepository extends BaseRepository<Video> {
  constructor() {
    super(VideoModel)
  }

  /** Used by the demo seed to attach comments to its clips. */
  findByTitle(title: string) {
    return this.model.findOne(this.active({ title })).lean()
  }
}

export const videoRepository = new VideoRepository()
