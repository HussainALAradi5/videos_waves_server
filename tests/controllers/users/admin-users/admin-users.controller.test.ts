import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerAdmin, registerUser, uploadVideo, VALID_PASSWORD } from '../../../helpers/api.helper'

const setActive = (userName: string, isActive: boolean, admin: Parameters<typeof bearer>[0]) =>
  api().patch(`/users/${userName}/status`).set(...bearer(admin)).send({ isActive })

describe('admin user management', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('deactivates a user: signed out, cannot sign in, and their content is hidden until reactivated', async () => {
    const admin = await registerAdmin('boss')
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    const video = await uploadVideo(ana, 'Ana clip')
    await api().post(`/videos/${video.id}/comments`).set(...bearer(ana)).send({ content: 'Mine' }).expect(201)
    await api().post(`/videos/${video.id}/comments`).set(...bearer(ben)).send({ content: 'Nice' }).expect(201)

    const response = await setActive('ana', false, admin).expect(200)
    expect(response.body.data).toMatchObject({ userName: 'ana', isActive: false })

    await api().get('/users/me').set(...bearer(ana)).expect(401)
    const login = await api().post('/auth/login').send({ identifier: 'ana', password: VALID_PASSWORD }).expect(403)
    expect(login.body.error.message).toMatch(/deactivated/)
    expect((await api().get('/videos').set(...bearer(ben))).body.data).toHaveLength(0)
    await api().get(`/videos/${video.id}`).set(...bearer(ben)).expect(404)
    await api().get('/users/ana').set(...bearer(ben)).expect(404)
    expect((await api().get('/users/ana').set(...bearer(admin)).expect(200)).body.data.isActive).toBe(false)
    await api().post('/chat/conversations').set(...bearer(ben)).send({ userName: 'ana' }).expect(404)

    await setActive('ana', true, admin).expect(200)
    expect((await api().get('/videos').set(...bearer(ben))).body.data).toHaveLength(1)
    const comments = await api().get(`/videos/${video.id}/comments`).set(...bearer(ben)).expect(200)
    expect(comments.body.data).toHaveLength(2)
    await api().post('/auth/login').send({ identifier: 'ana', password: VALID_PASSWORD }).expect(200)
  })

  it('hides a deactivated commenter on other people’s videos', async () => {
    const admin = await registerAdmin('boss')
    const owner = await registerUser('owner')
    const troll = await registerUser('troll')
    const video = await uploadVideo(owner)
    await api().post(`/videos/${video.id}/comments`).set(...bearer(troll)).send({ content: 'Spam' }).expect(201)
    await setActive('troll', false, admin).expect(200)
    expect((await api().get(`/videos/${video.id}/comments`)).body.data).toHaveLength(0)
  })

  it('only admins manage accounts, and never other admins or themselves', async () => {
    const admin = await registerAdmin('boss')
    const other = await registerAdmin('chief')
    const ana = await registerUser('ana')
    await setActive('boss', false, ana).expect(403)
    await setActive('chief', false, admin).expect(403)
    await setActive('boss', false, admin).expect(400)
    await setActive('nobody', false, admin).expect(404)
    await setActive('ana', false, other).expect(200)
  })

  it('lists every account with status and role filters', async () => {
    const admin = await registerAdmin('boss')
    await registerUser('ana')
    await registerUser('ben')
    await setActive('ben', false, admin).expect(200)

    const all = await api().get('/users?pageSize=10').set(...bearer(admin)).expect(200)
    expect(all.body.meta.totalItems).toBe(3)
    const inactive = await api().get('/users?status=inactive').set(...bearer(admin)).expect(200)
    expect(inactive.body.data.map((user: { userName: string }) => user.userName)).toEqual(['ben'])
    const admins = await api().get('/users?role=admin').set(...bearer(admin)).expect(200)
    expect(admins.body.data.map((user: { userName: string }) => user.userName)).toEqual(['boss'])
  })

  it('exports the filtered list as CSV without secrets', async () => {
    const admin = await registerAdmin('boss')
    await registerUser('ana')
    const response = await api().get('/users/export?search=ana').set(...bearer(admin)).expect(200)
    expect(response.headers['content-type']).toMatch(/text\/csv/)
    expect(response.headers['content-disposition']).toMatch(/videos-waves-users\.csv/)
    const lines = response.text.trim().split('\r\n')
    expect(lines[0]).toBe('code,userName,email,phone,role,gender,status,videosCount,followersCount,followingCount,createdAt')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('ana,ana@example.com,,user,female,active')
    expect(response.text).not.toMatch(/password/i)
    await api().get('/users/export').set(...bearer(await registerUser('ben'))).expect(403)
  })

  it('imports new accounts with one-time passwords and skips existing ones', async () => {
    const admin = await registerAdmin('boss')
    await registerUser('ana')
    const response = await api()
      .post('/users/import')
      .set(...bearer(admin))
      .send({
        rows: [
          { userName: 'cara', email: 'cara@example.com', gender: 'female' },
          { userName: 'ana', email: 'other@example.com', gender: 'female' },
          { userName: 'dan', email: 'dan@example.com', gender: 'male', role: 'admin' },
          { userName: 'dan2', email: 'dan@example.com', gender: 'male' }
        ]
      })
      .expect(200)
    const { created, skipped } = response.body.data
    expect(created.map((row: { userName: string }) => row.userName)).toEqual(['cara', 'dan'])
    expect(skipped.map((row: { reason: string }) => row.reason)).toEqual(['username already used', 'listed twice in this import'])

    const cara = created[0]
    await api().post('/auth/login').send({ identifier: 'cara', password: cara.temporaryPassword }).expect(200)
    await api().post('/users/import').set(...bearer(admin)).send({ rows: [{ userName: 'export', email: 'x@example.com', gender: 'male' }] }).expect(400)
  })
})
