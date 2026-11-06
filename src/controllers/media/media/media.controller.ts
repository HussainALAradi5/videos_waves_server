import type { Request, Response } from 'express'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { LOCAL_MEDIA_CACHE_MAX_AGE_MS } from '../../../constants/media/media/media.constants'
import type { LocalUploadDto } from '../../../dtos/media/media/local-upload.dto'
import type { MediaParamsDto } from '../../../dtos/media/media/media-params.dto'
import type { RegisterMediaDto } from '../../../dtos/media/media/register-media.dto'
import type { UploadSignatureRequestDto } from '../../../dtos/media/media/upload-signature-request.dto'
import { localStorageService } from '../../../globals/media/media-storage.globals'
import * as mediaService from '../../../services/media/media/media.service'
import * as localMediaService from '../../../services/media/media/local-media.service'
import { sendCreated, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, requireUser } from '../../../utilities/requests/request.utility'

export const createUploadSignature = (req: Request, res: Response): void => {
  sendSuccess(res, mediaService.createUploadSignature(getBody<UploadSignatureRequestDto>(req).kind, requireUser(req)))
}

export const registerMedia = async (req: Request, res: Response): Promise<void> => {
  sendCreated(res, await mediaService.registerMedia(getBody<RegisterMediaDto>(req), requireUser(req)))
}

export const deletePendingMedia = async (req: Request, res: Response): Promise<void> => {
  await mediaService.deletePendingMedia(getParams<MediaParamsDto>(req).mediaId, requireUser(req))
  sendSuccess(res, { message: MESSAGES.MEDIA.DELETED })
}

/** Local provider only: answers like ImageKit's upload API so clients need no special case. */
export const uploadLocalFile = async (req: Request, res: Response): Promise<void> => {
  const stored = await localMediaService.saveLocalUpload(req.file, getBody<LocalUploadDto>(req))
  res.status(200).json(stored)
}

/** Local provider only: streams a stored file with range support. */
export const serveLocalFile = async (req: Request, res: Response): Promise<void> => {
  const segments = req.params.filePath as unknown as string[]
  const filePath = await localMediaService.resolveLocalFile(
    `/${segments.join('/')}`,
    Number(req.query.expires),
    String(req.query.signature ?? '')
  )
  // `root` confines delivery to the media folder, blocking traversal such as "../".
  res.sendFile(filePath.slice(1), {
    root: localStorageService.rootDirectory,
    maxAge: LOCAL_MEDIA_CACHE_MAX_AGE_MS,
    dotfiles: 'deny'
  })
}
