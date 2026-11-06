import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as mediaController from '../../../controllers/media/media/media.controller'
import { localUploadSchema } from '../../../dtos/media/media/local-upload.dto'
import { mediaParamsSchema } from '../../../dtos/media/media/media-params.dto'
import { registerMediaSchema } from '../../../dtos/media/media/register-media.dto'
import { uploadSignatureRequestSchema } from '../../../dtos/media/media/upload-signature-request.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'
import { uploadRateLimit } from '../../../middlewares/security/rate-limit.middleware'
import { localMediaUpload } from '../../../middlewares/uploads/local-media-upload.middleware'

const { ROOT, SIGNATURE, BY_ID, LOCAL_UPLOAD, LOCAL_FILES } = ROUTES.MEDIA

export const mediaRoutes = Router()

mediaRoutes.post(
  SIGNATURE,
  authenticate,
  uploadRateLimit,
  validate({ body: uploadSignatureRequestSchema }),
  mediaController.createUploadSignature
)
mediaRoutes.post(ROOT, authenticate, validate({ body: registerMediaSchema }), mediaController.registerMedia)
mediaRoutes.delete(BY_ID, authenticate, validate({ params: mediaParamsSchema }), mediaController.deletePendingMedia)
// Local provider only. The signed fields replace a bearer token, as with ImageKit's upload API.
mediaRoutes.post(LOCAL_UPLOAD, uploadRateLimit, localMediaUpload, validate({ body: localUploadSchema }), mediaController.uploadLocalFile)
mediaRoutes.get(`${LOCAL_FILES}/*filePath`, mediaController.serveLocalFile)
