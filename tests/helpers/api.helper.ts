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
    .send({ userName, email: `${userName}@example.com`, password: VALID_PASSWORD })
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

export const uploadVideo = async (session: TestSession, title = 'My first wave') => {
  const response = await api()
    .post('/videos')
    .set(...bearer(session))
    .field('title', title)
    .attach('file', Buffer.from('fake video bytes'), { filename: 'clip.mp4', contentType: 'video/mp4' })
    .expect(201)
  return response.body.data
}
