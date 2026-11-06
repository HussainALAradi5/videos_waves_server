import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerUser, VALID_PASSWORD } from '../../../helpers/api.helper'

describe('auth endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('registers a user and returns a session without the password hash', async () => {
    const response = await api()
      .post('/auth/register')
      .send({ userName: 'wave_rider', email: 'Wave@Example.com', password: VALID_PASSWORD, gender: 'male' })
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.user).toMatchObject({ userName: 'wave_rider', email: 'wave@example.com', role: 'user', gender: 'male' })
    expect(response.body.data.user.code).toMatch(/^USR-/)
    expect(response.body.data.user.passwordHash).toBeUndefined()
    expect(response.body.data.accessToken).toBeTypeOf('string')
  })

  it('rejects a duplicate email with 409', async () => {
    await registerUser('first')
    const response = await api()
      .post('/auth/register')
      .send({ userName: 'second', email: 'first@example.com', password: VALID_PASSWORD, gender: 'female' })
      .expect(409)
    expect(response.body.error.code).toBe('CONFLICT')
  })

  it('rejects a weak password with field details', async () => {
    const response = await api()
      .post('/auth/register')
      .send({ userName: 'weak', email: 'weak@example.com', password: 'short', gender: 'female' })
      .expect(400)
    expect(response.body.error.details[0].field).toBe('body.password')
  })

  it('logs in with either username or email and rejects a wrong password', async () => {
    await registerUser('surfer')
    await api().post('/auth/login').send({ identifier: 'surfer', password: VALID_PASSWORD }).expect(200)
    await api().post('/auth/login').send({ identifier: 'SURFER@example.com', password: VALID_PASSWORD }).expect(200)
    const response = await api().post('/auth/login').send({ identifier: 'surfer', password: 'Wrong12345' }).expect(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('logs in with a mobile number in any common format', async () => {
    await api()
      .post('/auth/register')
      .send({ userName: 'caller', email: 'caller@example.com', phone: '+973 3300 1122', password: VALID_PASSWORD, gender: 'male' })
      .expect(201)
    await api().post('/auth/login').send({ identifier: '+97333001122', password: VALID_PASSWORD }).expect(200)
    await api().post('/auth/login').send({ identifier: '00973 3300-1122', password: VALID_PASSWORD }).expect(200)
    await api().post('/auth/login').send({ identifier: '+97333001122', password: 'Wrong12345' }).expect(401)
  })

  it('rejects a username, email, or mobile number that is already taken', async () => {
    await api()
      .post('/auth/register')
      .send({ userName: 'original', email: 'original@example.com', phone: '+97333004455', password: VALID_PASSWORD, gender: 'female' })
      .expect(201)
    const taken = [
      { userName: 'original', email: 'other1@example.com' },
      { userName: 'other2', email: 'ORIGINAL@example.com' },
      { userName: 'other3', email: 'other3@example.com', phone: '+973 3300 4455' }
    ]
    for (const fields of taken) {
      await api().post('/auth/register').send({ ...fields, password: VALID_PASSWORD, gender: 'male' }).expect(409)
    }
  })

  it('requires a gender at registration', async () => {
    await api().post('/auth/register').send({ userName: 'nogender', email: 'n@example.com', password: VALID_PASSWORD }).expect(400)
  })

  it('rotates refresh tokens and revokes a session when an old token is replayed', async () => {
    const session = await registerUser('rotator')
    const first = (await api().post('/auth/refresh').send({ refreshToken: session.refreshToken }).expect(200)).body.data
    await api().post('/auth/refresh').send({ refreshToken: first.refreshToken }).expect(200)
    // The original token is now two rotations old: treated as stolen, and the whole session ends.
    const replay = await api().post('/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401)
    expect(replay.body.error.message).toMatch(/signed out for your security/)
    await api().get('/users/me').set('Authorization', `Bearer ${first.accessToken}`).expect(401)
  })

  it('lets two tabs refresh with the same token at once', async () => {
    const session = await registerUser('twotabs')
    const [left, right] = await Promise.all([
      api().post('/auth/refresh').send({ refreshToken: session.refreshToken }),
      api().post('/auth/refresh').send({ refreshToken: session.refreshToken })
    ])
    expect([left.status, right.status]).toEqual([200, 200])
    await api().post('/auth/refresh').send({ refreshToken: right.body.data.refreshToken }).expect(200)
  })

  it('signs out one device at a time, or every device at once', async () => {
    const laptop = await registerUser('multidevice')
    const phone = (await api().post('/auth/login').send({ identifier: 'multidevice', password: VALID_PASSWORD })).body.data
    const phoneAuth: [string, string] = ['Authorization', `Bearer ${phone.accessToken}`]
    const sessions = (await api().get('/auth/sessions').set(...phoneAuth).expect(200)).body.data
    expect(sessions).toHaveLength(2)
    expect(sessions.filter((item: { isCurrent: boolean }) => item.isCurrent)).toHaveLength(1)

    await api().post('/auth/logout').set(...bearer(laptop)).expect(200)
    await api().get('/users/me').set(...bearer(laptop)).expect(401)
    await api().get('/users/me').set(...phoneAuth).expect(200)

    await api().post('/auth/logout-all').set(...phoneAuth).expect(200)
    await api().get('/users/me').set(...phoneAuth).expect(401)
    await api().post('/auth/refresh').send({ refreshToken: phone.refreshToken }).expect(401)
  })

  it('does not accept a refresh token as an access token', async () => {
    const session = await registerUser('mixer')
    await api().get('/users/me').set('Authorization', `Bearer ${session.refreshToken}`).expect(401)
  })

  it('requires a token for the profile and blocks deactivated users', async () => {
    await api().get('/users/me').expect(401)
    const session = await registerUser('leaver')
    await api().delete('/users/me').set(...bearer(session)).expect(200)
    await api().post('/auth/login').send({ identifier: 'leaver', password: VALID_PASSWORD }).expect(401)
  })

  it('changes the password only with the current password', async () => {
    const session = await registerUser('changer')
    await api()
      .patch('/users/me/password')
      .set(...bearer(session))
      .send({ currentPassword: 'Nope12345', newPassword: 'NewPassword1', confirmPassword: 'NewPassword1' })
      .expect(400)
    await api()
      .patch('/users/me/password')
      .set(...bearer(session))
      .send({ currentPassword: VALID_PASSWORD, newPassword: 'NewPassword1', confirmPassword: 'NewPassword1' })
      .expect(200)
    await api().post('/auth/login').send({ identifier: 'changer', password: 'NewPassword1' }).expect(200)
  })
})
