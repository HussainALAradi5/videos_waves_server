import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerUser, uploadMedia, uploadVideo } from '../../../helpers/api.helper'

const profile = (userName: string, viewer?: Parameters<typeof bearer>[0]) => {
  const request = api().get(`/users/${userName}`)
  return viewer ? request.set(...bearer(viewer)) : request
}

describe('social endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('follows idempotently and keeps both counters in step', async () => {
    const ana = await registerUser('ana')
    await registerUser('ben')
    await api().put('/users/ben/follow').set(...bearer(ana)).expect(200)
    const again = await api().put('/users/ben/follow').set(...bearer(ana)).expect(200)
    expect(again.body.data).toEqual({ userName: 'ben', isFollowing: true, followersCount: 1 })
    expect((await profile('ana', ana)).body.data).toMatchObject({ followingCount: 1, isMe: true })
    expect((await profile('ben', ana)).body.data).toMatchObject({ followersCount: 1, isFollowing: true, followsYou: false })

    const followers = await api().get('/users/ben/followers').set(...bearer(ana)).expect(200)
    expect(followers.body.data.map((row: { userName: string }) => row.userName)).toEqual(['ana'])

    await api().delete('/users/ben/follow').set(...bearer(ana)).expect(200)
    expect((await profile('ben')).body.data.followersCount).toBe(0)
  })

  it('refuses to follow yourself and reserves route names', async () => {
    const solo = await registerUser('solo')
    await api().put('/users/solo/follow').set(...bearer(solo)).expect(400)
    await api().post('/auth/register').send({ userName: 'search', email: 's@example.com', password: 'Password123', gender: 'male' }).expect(400)
  })

  it('shows only followed people in the following feed', async () => {
    const fan = await registerUser('fan')
    const star = await registerUser('star')
    const other = await registerUser('other')
    await uploadVideo(star, 'Star clip')
    await uploadVideo(other, 'Other clip')
    await api().get('/videos?scope=following').expect(401)
    await api().put('/users/star/follow').set(...bearer(fan))
    const feed = await api().get('/videos?scope=following').set(...bearer(fan)).expect(200)
    expect(feed.body.data.map((video: { title: string }) => video.title)).toEqual(['Star clip'])
  })

  it('blocking removes follows and hides both people from each other', async () => {
    const blocker = await registerUser('blocker')
    const pest = await registerUser('pest')
    await api().put('/users/blocker/follow').set(...bearer(pest))
    await api().put('/users/pest/follow').set(...bearer(blocker))
    const video = await uploadVideo(blocker, 'Private life')

    await api().put('/users/pest/block').set(...bearer(blocker)).expect(200)
    expect((await profile('blocker', blocker)).body.data).toMatchObject({ followersCount: 0, followingCount: 0 })
    await profile('blocker', pest).expect(404)
    expect((await profile('pest', blocker)).body.data.isBlocked).toBe(true)
    await api().get(`/videos/${video.id}`).set(...bearer(pest)).expect(404)
    const feed = await api().get('/videos').set(...bearer(pest)).expect(200)
    expect(feed.body.data).toHaveLength(0)
    await api().post(`/videos/${video.id}/comments`).set(...bearer(pest)).send({ content: 'hi' }).expect(404)
    await api().put('/users/pest/follow').set(...bearer(blocker)).expect(409)
    const search = await api().get('/users/search?search=blo').set(...bearer(pest)).expect(200)
    expect(search.body.data).toHaveLength(0)
    const blocked = await api().get('/users/me/blocked').set(...bearer(blocker)).expect(200)
    expect(blocked.body.data.map((row: { userName: string }) => row.userName)).toEqual(['pest'])

    await api().delete('/users/pest/block').set(...bearer(blocker)).expect(200)
    await profile('blocker', pest).expect(200)
  })

  it('keeps a restricted person\'s comments pending until the owner approves them', async () => {
    const owner = await registerUser('owner')
    const troll = await registerUser('troll')
    const guest = await registerUser('guest')
    const video = await uploadVideo(owner)
    await api().put('/users/troll/restrict').set(...bearer(owner)).expect(200)

    const created = await api().post(`/videos/${video.id}/comments`).set(...bearer(troll)).send({ content: 'hmm' }).expect(201)
    expect(created.body.data.isPendingApproval).toBe(true)
    const contents = async (viewer: Parameters<typeof bearer>[0]) =>
      (await api().get(`/videos/${video.id}/comments`).set(...bearer(viewer))).body.data.map((c: { content: string }) => c.content)
    expect(await contents(troll)).toEqual(['hmm'])
    expect(await contents(owner)).toEqual(['hmm'])
    expect(await contents(guest)).toEqual([])
    expect((await api().get(`/videos/${video.id}`)).body.data.commentsCount).toBe(0)

    await api().patch(`/videos/${video.id}/comments/${created.body.data.id}/approve`).set(...bearer(troll)).expect(403)
    await api().patch(`/videos/${video.id}/comments/${created.body.data.id}/approve`).set(...bearer(owner)).expect(200)
    expect(await contents(guest)).toEqual(['hmm'])
    expect((await api().get(`/videos/${video.id}`)).body.data.commentsCount).toBe(1)
  })

  it('sets and removes an avatar through the media flow', async () => {
    const session = await registerUser('selfie')
    const media = await uploadMedia(session, { kind: 'avatar', fileName: 'me.png', contentType: 'image/png' })
    const updated = await api().patch('/users/me/avatar').set(...bearer(session)).send({ mediaId: media.id }).expect(200)
    expect(updated.body.data.avatarUrl).toBe(media.url)
    const cleared = await api().patch('/users/me/avatar').set(...bearer(session)).send({ mediaId: null }).expect(200)
    expect(cleared.body.data.avatarUrl).toBeNull()
    await api().get(new URL(media.url).pathname).expect(404)
  })
})
