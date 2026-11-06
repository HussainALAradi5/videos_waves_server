import { mkdirSync } from 'fs'
import path from 'path'
import multer from 'multer'
import { storageConfig } from '../../config/storage/storage.config'
import { MEDIA_RULES, MEDIA_UPLOAD_FIELD } from '../../constants/media/media/media.constants'

const TEMP_FOLDER = '.tmp'
const temporaryDirectory = path.join(storageConfig.local.directory, TEMP_FOLDER)
const largestAllowedBytes = Math.max(storageConfig.maxVideoBytes, ...Object.values(MEDIA_RULES).map((rule) => rule.maxBytes))

mkdirSync(temporaryDirectory, { recursive: true })

/**
 * Receives one file for the local provider into a temporary folder (random multer name). The
 * per-kind type and size rules are enforced when the upload is registered, exactly as with ImageKit.
 */
export const localMediaUpload = multer({
  dest: temporaryDirectory,
  limits: { fileSize: largestAllowedBytes, files: 1 }
}).single(MEDIA_UPLOAD_FIELD)
