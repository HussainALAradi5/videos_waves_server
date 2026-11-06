import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerUser } from '../../../helpers/api.helper'

describe('settings endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('returns defaults, saves known keys, and rejects unknown ones', async () => {
    const session = await registerUser('tuner')
    const defaults = (await api().get('/users/me/settings').set(...bearer(session)).expect(200)).body.data
    expect(defaults).toMatchObject({ theme: 'system', readReceipts: true, messagePermission: 'everyone' })

    const saved = await api().patch('/users/me/settings').set(...bearer(session)).send({ theme: 'dark', bubbleColor: 'sunset' })
    expect(saved.body.data).toMatchObject({ theme: 'dark', bubbleColor: 'sunset', readReceipts: true })
    await api().patch('/users/me/settings').set(...bearer(session)).send({ theme: 'neon' }).expect(400)
    await api().patch('/users/me/settings').set(...bearer(session)).send({ secretFlag: true }).expect(400)
  })

  it('lets people accept messages only from accounts they follow', async () => {
    const quiet = await registerUser('quiet')
    const stranger = await registerUser('stranger')
    await api().patch('/users/me/settings').set(...bearer(quiet)).send({ messagePermission: 'following' })
    await api().post('/chat/conversations').set(...bearer(stranger)).send({ userName: 'quiet' }).expect(403)
    await api().put('/users/stranger/follow').set(...bearer(quiet))
    await api().post('/chat/conversations').set(...bearer(stranger)).send({ userName: 'quiet' }).expect(200)
  })

  it('hides read times from others when read receipts are off', async () => {
    const ana = await registerUser('anaread')
    const ben = await registerUser('benread')
    const chat = (await api().post('/chat/conversations').set(...bearer(ana)).send({ userName: 'benread' })).body.data
    await api().post(`/chat/conversations/${chat.id}/messages`).set(...bearer(ana)).send({ body: 'hi' })
    await api().patch('/users/me/settings').set(...bearer(ben)).send({ readReceipts: false })
    await api().post(`/chat/conversations/${chat.id}/read`).set(...bearer(ben)).expect(200)
    const view = (await api().get(`/chat/conversations/${chat.id}`).set(...bearer(ana))).body.data
    expect(view.members[0].lastReadAt).toBeNull()
  })
})
