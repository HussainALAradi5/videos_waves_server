import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerUser, VALID_PASSWORD } from '../../../helpers/api.helper'

const search = (text: string, viewer: Parameters<typeof bearer>[0]) =>
  api().get(`/users/search?search=${encodeURIComponent(text)}`).set(...bearer(viewer)).expect(200)

const names = (response: { body: { data: { userName: string }[] } }) => response.body.data.map((row) => row.userName)

describe('people search', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('finds someone only by their full email or phone number', async () => {
    const me = await registerUser('seeker')
    await api()
      .post('/auth/register')
      .send({ userName: 'dana', email: 'dana@example.com', phone: '+973 3300-1122', password: VALID_PASSWORD, gender: 'female' })
      .expect(201)

    expect(names(await search('dana@example.com', me))).toEqual(['dana'])
    expect(names(await search('DANA@Example.com', me))).toEqual(['dana'])
    expect(names(await search('+97333001122', me))).toEqual(['dana'])
    expect(names(await search('00973 3300 1122', me))).toEqual(['dana'])

    for (const partial of ['dana', 'dan', 'dana@example', '3300', 'example.com']) {
      const response = await search(partial, me)
      expect(response.body.data).toEqual([])
      expect(response.body.meta.totalItems).toBe(0)
    }
    expect(names(await search('nobody@example.com', me))).toEqual([])
  })

  it('keeps phone numbers private, unique, and editable', async () => {
    const ana = await registerUser('ana')
    await api().patch('/users/me').set(...bearer(ana)).send({ phone: '+1 (555) 010-0042' }).expect(200)
    expect((await api().get('/users/me').set(...bearer(ana))).body.data.phone).toBe('+15550100042')
    expect((await api().get('/users/ana').set(...bearer(ana))).body.data.phone).toBeUndefined()

    await api()
      .post('/auth/register')
      .send({ userName: 'copy', email: 'copy@example.com', phone: '+15550100042', password: VALID_PASSWORD, gender: 'male' })
      .expect(409)
    await api().patch('/users/me').set(...bearer(ana)).send({ phone: '12345' }).expect(400)
    await api().patch('/users/me').set(...bearer(ana)).send({ phone: null }).expect(200)
    expect((await api().get('/users/me').set(...bearer(ana))).body.data.phone).toBeNull()
  })
})
