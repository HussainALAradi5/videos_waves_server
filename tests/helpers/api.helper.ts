import request from 'supertest'
import { createApp } from '../../src/app'
import { UserModel } from '../../src/models/users/user/user.model'
import { Role } from '../../src/enums/users/roles/role.enum'

export const app = createApp()
export const api = () => request(app)

export const VALID_PASSWORD = 'Password123'

export interface TestSession {
  id: string
  accessToken: string
  refreshToken: string
}

export const registerUser = async (userName: string): Promise<TestSession> => {
  const response = await api()
    .post('/auth/register')
    .send({ userName, email: `${userName}@example.com`, password: VALID_PASSWORD, gender: 'female' })
    .expect(201)
  const { accessToken, refreshToken, user } = response.body.data
  return { id: user.id, accessToken, refreshToken }
}

export const registerAdmin = async (userName: string): Promise<TestSession> => {
  const session = await registerUser(userName)
  await UserModel.updateOne({ _id: session.id }, { $set: { role: Role.ADMIN } })
  return session
}

export const bearer = (session: TestSession): [string, string] => ['Authorization', `Bearer ${session.accessToken}`]

export interface UploadOptions {
  kind?: string
  fileName?: string
  contentType?: string
  bytes?: Buffer
  /** Overrides the folder the signature returned, to simulate a tampered upload. */
  folder?: string
  isPrivateFile?: boolean
}

/** Steps 1-2 of the upload flow against the local provider: sign, then upload. Returns the provider response. */
export const uploadFile = async (session: TestSession, options: UploadOptions = {}) => {
  const kind = options.kind ?? 'video'
  const signature = (await api().post('/media/signature').set(...bearer(session)).send({ kind }).expect(200)).body.data
  const response = await api()
    .post('/media/local-upload')
    .field('fileName', options.fileName ?? 'clip.mp4')
    .field('folder', options.folder ?? signature.folder)
    .field('token', signature.token)
    .field('expire', String(signature.expire))
    .field('signature', signature.signature)
    .field('isPrivateFile', String(options.isPrivateFile ?? signature.isPrivateFile))
    .attach('file', options.bytes ?? Buffer.from('fake video bytes'), {
      filename: options.fileName ?? 'clip.mp4',
      contentType: options.contentType ?? 'video/mp4'
    })
    .expect(200)
  return response.body as { fileId: string; filePath: string; url: string }
}

/** The full flow: sign, upload, and register; returns the media DTO. */
export const uploadMedia = async (session: TestSession, options: UploadOptions = {}) => {
  const stored = await uploadFile(session, options)
  const response = await api()
    .post('/media')
    .set(...bearer(session))
    .send({ fileId: stored.fileId, kind: options.kind ?? 'video', originalName: options.fileName ?? 'clip.mp4' })
    .expect(201)
  return response.body.data
}

export const uploadVideo = async (session: TestSession, title = 'My first wave') => {
  const media = await uploadMedia(session)
  const response = await api()
    .post('/videos')
    .set(...bearer(session))
    .send({ mediaId: media.id, title })
    .expect(201)
  return response.body.data
}
