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
      .send({ userName: 'wave_rider', email: 'Wave@Example.com', password: VALID_PASSWORD })
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.user).toMatchObject({ userName: 'wave_rider', email: 'wave@example.com', role: 'user' })
    expect(response.body.data.user.code).toMatch(/^USR-/)
    expect(response.body.data.user.passwordHash).toBeUndefined()
    expect(response.body.data.accessToken).toBeTypeOf('string')
  })

  it('rejects a duplicate email with 409', async () => {
    await registerUser('first')
    const response = await api()
      .post('/auth/register')
      .send({ userName: 'second', email: 'first@example.com', password: VALID_PASSWORD })
      .expect(409)
    expect(response.body.error.code).toBe('CONFLICT')
  })

  it('rejects a weak password with field details', async () => {
    const response = await api()
      .post('/auth/register')
      .send({ userName: 'weak', email: 'weak@example.com', password: 'short' })
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

  it('refreshes tokens, and logout revokes the refresh token', async () => {
    const session = await registerUser('refresher')
    await api().post('/auth/refresh').send({ refreshToken: session.refreshToken }).expect(200)
    await api().post('/auth/logout').set(...bearer(session)).expect(200)
    await api().post('/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401)
    await api().get('/users/me').set(...bearer(session)).expect(401)
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
