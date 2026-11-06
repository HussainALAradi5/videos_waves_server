import type { AuthUser } from '../../interfaces/users/auth/auth-user.interface'
import type { ValidatedRequestData } from '../../interfaces/common/requests/validated-request-data.interface'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string
      user?: AuthUser
      validated: ValidatedRequestData
    }
  }
}

export {}
