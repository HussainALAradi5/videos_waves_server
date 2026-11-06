import { VideoModel } from '../../../models/videos/video/video.model'
import type { Video } from '../../../interfaces/models/videos/video/video.interface'
import { BaseRepository } from '../../base/base.repository'

class VideoRepository extends BaseRepository<Video> {
  constructor() {
    super(VideoModel)
  }
}

export const videoRepository = new VideoRepository()
