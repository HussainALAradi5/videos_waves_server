import { randomUUID } from 'crypto'
import { mkdirSync } from 'fs'
import path from 'path'
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { storageConfig } from '../../config/storage/storage.config'
import { MESSAGES } from '../../constants/common/messages.constants'
import { VIDEO_UPLOAD_FIELD } from '../../constants/videos/video/video.constants'
import { ErrorCode } from '../../enums/common/error-code.enum'
import { AppError, badRequest } from '../../utilities/errors/app-error.utility'
import { isVideoMimeType } from '../../validations/videos/video/video-file.validation'

const SAFE_EXTENSION = /^\.[a-z0-9]{1,5}$/

mkdirSync(storageConfig.videosDirectory, { recursive: true })

// The client's file name is never used on disk: a random UUID plus a sanitised extension.
const storage = multer.diskStorage({
  destination: storageConfig.videosDirectory,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    callback(null, `${randomUUID()}${SAFE_EXTENSION.test(extension) ? extension : ''}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: storageConfig.maxVideoBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (isVideoMimeType(file.mimetype)) callback(null, true)
    else callback(new AppError(ErrorCode.UNSUPPORTED_MEDIA_TYPE, MESSAGES.VIDEOS.FILE_TYPE_INVALID))
  }
})

const requireFile = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.file) throw badRequest(MESSAGES.VIDEOS.FILE_REQUIRED)
  next()
}

export const videoUpload = [upload.single(VIDEO_UPLOAD_FIELD), requireFile]
