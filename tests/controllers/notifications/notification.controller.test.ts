import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-database.helper'
import { api, bearer, registerUser, uploadVideo, type TestSession } from '../../helpers/api.helper'

const bell = async (session: TestSession, query = '') =>
  (await api().get(`/notifications${query}`).set(...bearer(session)).expect(200)).body.data as {
    id: string
    kind: string
    message: string
    link: string
    isRead: boolean
  }[]

const unread = async (session: TestSession) =>
  (await api().get('/notifications/unread-count').set(...bearer(session)).expect(200)).body.data.unreadCount

describe('notifications', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('tells owners about follows, likes, comments, and replies, once each', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    const video = await uploadVideo(ana, 'Sunset')

    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    await api().put(`/videos/${video.id}/like`).set(...bearer(ben)).expect(200)
    await api().put(`/videos/${video.id}/like`).set(...bearer(ana)).expect(200)
    const comment = (await api().post(`/videos/${video.id}/comments`).set(...bearer(ben)).send({ content: 'Nice' }).expect(201)).body.data
    await api().post(`/videos/${video.id}/comments`).set(...bearer(ana)).send({ content: 'Thanks', parentId: comment.id }).expect(201)

    const anas = await bell(ana)
    expect(anas.map((item) => item.kind)).toEqual(['comment', 'like', 'follow'])
    expect(anas[1]).toMatchObject({ message: 'ben liked your video "Sunset"', link: `/videos/${video.id}`, isRead: false })
    expect(anas[2].link).toBe('/u/ben')
    expect((await bell(ben)).map((item) => item.kind)).toEqual(['reply'])
    expect(await unread(ana)).toBe(3)
  })

  it('marks one or all read, filters unread, and keeps them private', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    const cai = await registerUser('cai')
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    await api().put('/users/ana/follow').set(...bearer(cai)).expect(200)
    const [latest] = await bell(ana)

    await api().patch(`/notifications/${latest.id}/read`).set(...bearer(ben)).expect(404)
    expect((await api().patch(`/notifications/${latest.id}/read`).set(...bearer(ana)).expect(200)).body.data.isRead).toBe(true)
    expect(await unread(ana)).toBe(1)
    expect(await bell(ana, '?filter=unread')).toHaveLength(1)
    await api().patch('/notifications/read-all').set(...bearer(ana)).expect(200)
    expect(await unread(ana)).toBe(0)
  })

  it('leaves out people the viewer blocked', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    await api().put('/users/ben/block').set(...bearer(ana)).expect(200)
    expect(await bell(ana)).toEqual([])
    expect(await unread(ana)).toBe(0)
  })

  it('tells people they were added to a group', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await registerUser('cai')
    await api().post('/chat/groups').set(...bearer(ana)).send({ title: 'Crew', userNames: ['ben', 'cai'] }).expect(201)
    const [added] = await bell(ben)
    expect(added).toMatchObject({ kind: 'group_added', message: 'ana added you to "Crew"' })
  })
})
