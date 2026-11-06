import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-database.helper'
import { api, bearer, registerUser, type TestSession } from '../../helpers/api.helper'

const settings = (session: TestSession, body: Record<string, unknown>, status = 200) =>
  api().patch('/users/me/settings').set(...bearer(session)).send(body).expect(status)

const startChat = async (from: TestSession, userName: string) =>
  (await api().post('/chat/conversations').set(...bearer(from)).send({ userName }).expect(200)).body.data

const send = async (session: TestSession, chatId: string, body: string) =>
  (await api().post(`/chat/conversations/${chatId}/messages`).set(...bearer(session)).send({ body }).expect(201)).body.data

describe('chat look, status, and unsend', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('saves bubble shape, both colours, and pop-ups as settings, and rejects unknown values', async () => {
    const ana = await registerUser('ana')
    const defaults = (await api().get('/users/me/settings').set(...bearer(ana)).expect(200)).body.data
    expect(defaults).toMatchObject({ bubbleStyle: 'rounded', bubbleColor: 'wave', othersBubbleColor: 'neutral', notifyMessages: true })

    const saved = (await settings(ana, { bubbleStyle: 'minimal', bubbleColor: 'forest', othersBubbleColor: 'sunset', notifyMessages: false })).body.data
    expect(saved).toMatchObject({ bubbleStyle: 'minimal', bubbleColor: 'forest', othersBubbleColor: 'sunset', notifyMessages: false })
    await settings(ana, { bubbleStyle: 'bubbly' }, 400)
    await settings(ana, { bubbleColor: 'purple' }, 400)
  })

  it('shows my chosen status and custom line to chat partners, and invisible as offline', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    const chat = await startChat(ana, 'ben')
    await settings(ben, { presence: 'busy', statusText: 'In a meeting' })
    await settings(ben, { statusText: 'x'.repeat(61) }, 400)

    const member = async () => (await api().get(`/chat/conversations/${chat.id}`).set(...bearer(ana)).expect(200)).body.data.members[0]
    // Not connected over a socket in tests, so the state is offline; the status line still shows.
    expect(await member()).toMatchObject({ presence: 'offline', isOnline: false, statusText: 'In a meeting' })
    await settings(ben, { showActivityStatus: false })
    expect(await member()).toMatchObject({ presence: null, statusText: null })
  })

  it('unsends only until someone else reads the message', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    const chat = await startChat(ana, 'ben')
    const base = `/chat/conversations/${chat.id}/messages`

    const unseen = await send(ana, chat.id, 'oops')
    await api().delete(`${base}/${unseen.id}?scope=everyone`).set(...bearer(ana)).expect(200)

    const seen = await send(ana, chat.id, 'hello')
    await api().post(`/chat/conversations/${chat.id}/read`).set(...bearer(ben)).expect(200)
    const refused = await api().delete(`${base}/${seen.id}?scope=everyone`).set(...bearer(ana)).expect(409)
    expect(refused.body.error.message).toMatch(/already seen/i)
    await api().delete(`${base}/${seen.id}?scope=me`).set(...bearer(ana)).expect(200)
  })

  it('keeps each member’s chat background to themselves, and filters read and unread chats', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await registerUser('cai')
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    const chat = await startChat(ana, 'ben')
    const quiet = await startChat(ana, 'cai')

    const mine = (await api().patch(`/chat/conversations/${chat.id}`).set(...bearer(ana)).send({ background: 'ocean' }).expect(200)).body.data
    expect(mine.me.background).toBe('ocean')
    const bens = (await api().get(`/chat/conversations/${chat.id}`).set(...bearer(ben)).expect(200)).body.data
    expect(bens.me.background).toBe('none')
    await api().patch(`/chat/conversations/${chat.id}`).set(...bearer(ana)).send({ background: 'rainbow' }).expect(400)

    await send(ben, chat.id, 'are you there?')
    const folder = async (name: string) =>
      (await api().get(`/chat/conversations?folder=${name}`).set(...bearer(ana)).expect(200)).body.data.map((item: { id: string }) => item.id)
    expect(await folder('unread')).toEqual([chat.id])
    expect(await folder('read')).toEqual([quiet.id])
  })
})
