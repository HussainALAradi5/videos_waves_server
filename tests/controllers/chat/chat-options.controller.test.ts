import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-database.helper'
import { api, bearer, registerUser, type TestSession } from '../../helpers/api.helper'

const HOUR_MS = 60 * 60 * 1000

const startChat = async (from: TestSession, userName: string) =>
  (await api().post('/chat/conversations').set(...bearer(from)).send({ userName }).expect(200)).body.data

const mute = (session: TestSession, id: string, value: string) =>
  api().patch(`/chat/conversations/${id}`).set(...bearer(session)).send({ mute: value }).expect(200)

describe('chat options', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('mutes for 8 hours, a week, or until unmuted, and unmutes', async () => {
    const ana = await registerUser('ana')
    await registerUser('ben')
    const chat = await startChat(ana, 'ben')

    const eightHours = (await mute(ana, chat.id, '8h')).body.data.me
    expect(eightHours.isMuted).toBe(true)
    const ends = Date.parse(eightHours.mutedUntil) - Date.now()
    expect(ends).toBeGreaterThan(7.9 * HOUR_MS)
    expect(ends).toBeLessThanOrEqual(8 * HOUR_MS)

    const week = (await mute(ana, chat.id, '1w')).body.data.me
    expect(Date.parse(week.mutedUntil) - Date.now()).toBeGreaterThan(6.9 * 24 * HOUR_MS)

    expect(new Date((await mute(ana, chat.id, 'always')).body.data.me.mutedUntil).getUTCFullYear()).toBe(9999)
    expect((await mute(ana, chat.id, 'off')).body.data.me).toMatchObject({ isMuted: false, mutedUntil: null })
    await api().patch(`/chat/conversations/${chat.id}`).set(...bearer(ana)).send({ mute: 'forever' }).expect(400)
  })

  it('deletes a chat only for me, and it comes back with a new message', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    const chat = await startChat(ana, 'ben')
    await api().post(`/chat/conversations/${chat.id}/messages`).set(...bearer(ana)).send({ body: 'hi' }).expect(201)

    await api().delete(`/chat/conversations/${chat.id}`).set(...bearer(ben)).expect(200)
    const list = async (session: TestSession) => (await api().get('/chat/conversations').set(...bearer(session))).body.data
    expect(await list(ben)).toHaveLength(0)
    expect(await list(ana)).toHaveLength(1)

    await api().post(`/chat/conversations/${chat.id}/messages`).set(...bearer(ana)).send({ body: 'still there?' }).expect(201)
    expect(await list(ben)).toHaveLength(1)
  })

  it('leaves a group: history stays readable, but no more writing', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await registerUser('cara')
    const group = (await api().post('/chat/groups').set(...bearer(ana)).send({ title: 'Crew', userNames: ['ben', 'cara'] }).expect(201)).body.data
    await api().delete(`/chat/conversations/${group.id}/members/${ben.id}`).set(...bearer(ben)).expect(200)
    await api().get(`/chat/conversations/${group.id}/messages`).set(...bearer(ben)).expect(200)
    await api().post(`/chat/conversations/${group.id}/messages`).set(...bearer(ben)).send({ body: 'back?' }).expect(403)
  })
})
