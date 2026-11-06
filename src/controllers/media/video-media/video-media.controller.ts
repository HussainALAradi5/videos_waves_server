import type { Request, Response } from 'express'
import { storageConfig } from '../../../config/storage/storage.config'
import { MESSAGES } from '../../../constants/common/messages.constants'
import * as videoService from '../../../services/videos/video/video.service'
import { notFound } from '../../../utilities/errors/app-error.utility'

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Streams a stored video (with HTTP range support) only while its video record is active. */
export const streamVideo = async (req: Request, res: Response): Promise<void> => {
  const fileName = String(req.params.fileName)
  if (!(await videoService.isStreamable(fileName))) throw notFound(MESSAGES.VIDEOS.NOT_FOUND)
  // `root` confines the path to the storage folder, blocking traversal such as "../".
  res.sendFile(fileName, { root: storageConfig.videosDirectory, maxAge: CACHE_MAX_AGE_MS, dotfiles: 'deny' })
}
