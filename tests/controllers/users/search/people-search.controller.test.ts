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

  it('matches any part of a username, email, or phone number, ignoring case', async () => {
    const me = await registerUser('seeker')
    await api()
      .post('/auth/register')
      .send({ userName: 'Dana_K', email: 'dana.k@mail.test', phone: '+973 3300-1122', password: VALID_PASSWORD, gender: 'female' })
      .expect(201)
    await registerUser('omar')

    for (const text of ['dana', 'DAN', 'na_k', 'dana.k@MAIL', 'mail.test', '3300', '3300 1122', '+973', '97333001122']) {
      expect(names(await search(text, me))).toEqual(['Dana_K'])
    }
    // Both test helpers' accounts use example.com addresses, including the searcher's own.
    expect(names(await search('EXAMPLE.com', me)).sort()).toEqual(['omar', 'seeker'])
    expect(names(await search('zzz', me))).toEqual([])
    const empty = await api().get('/users/search').set(...bearer(me)).expect(200)
    expect(empty.body.meta.totalItems).toBe(0)
    expect((await search('3300', me)).body.data[0].phone).toBeUndefined()
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
