import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerUser, uploadVideo, type TestSession } from '../../../helpers/api.helper'

const goPrivate = (session: TestSession, value = true) =>
  api().patch('/users/me/settings').set(...bearer(session)).send({ privateAccount: value }).expect(200)

const profile = async (userName: string, viewer?: TestSession) => {
  const request = api().get(`/users/${userName}`)
  return (await (viewer ? request.set(...bearer(viewer)) : request).expect(200)).body.data
}

const feed = async (query: string, viewer?: TestSession) => {
  const request = api().get(`/videos${query}`)
  return (await (viewer ? request.set(...bearer(viewer)) : request).expect(200)).body.data as { title: string }[]
}

describe('private accounts', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('turns a follow into a request, hides videos until it is accepted, then shows them', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    const video = await uploadVideo(ana, 'Secret wave')
    await goPrivate(ana)

    const follow = (await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)).body.data
    expect(follow).toMatchObject({ isFollowing: false, isRequested: true, followersCount: 0 })
    expect(await profile('ana', ben)).toMatchObject({ isPrivate: true, canViewContent: false, isRequested: true })
    expect(await profile('ben', ana)).toMatchObject({ requestedYou: true })
    expect(await feed('', ben)).toEqual([])
    await api().get(`/videos/${video.id}`).set(...bearer(ben)).expect(403)
    await api().get(`/videos/${video.id}`).expect(403)
    await api().get('/users/ana/followers').set(...bearer(ben)).expect(403)

    const requests = (await api().get('/users/me/follow-requests').set(...bearer(ana)).expect(200)).body.data
    expect(requests.map((person: { userName: string }) => person.userName)).toEqual(['ben'])
    await api().put('/users/me/follow-requests/ben').set(...bearer(ana)).expect(200)

    expect(await profile('ana', ben)).toMatchObject({ isFollowing: true, canViewContent: true, isRequested: false, followersCount: 1 })
    expect((await feed('', ben)).map((item) => item.title)).toEqual(['Secret wave'])
    await api().get(`/videos/${video.id}`).set(...bearer(ben)).expect(200)
    await api().put('/users/me/follow-requests/ben').set(...bearer(ana)).expect(404)
  })

  it('declines and cancels requests without following', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await goPrivate(ana)
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    await api().delete('/users/me/follow-requests/ben').set(...bearer(ana)).expect(200)
    expect(await profile('ana', ben)).toMatchObject({ isFollowing: false, isRequested: false })

    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    await api().delete('/users/ana/follow').set(...bearer(ben)).expect(200)
    expect(await profile('ana', ben)).toMatchObject({ isRequested: false })
  })

  it('accepts everyone waiting when the account goes public', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    await goPrivate(ana)
    await api().put('/users/ana/follow').set(...bearer(ben)).expect(200)
    await goPrivate(ana, false)
    expect(await profile('ana', ben)).toMatchObject({ isFollowing: true, isPrivate: false, followersCount: 1 })
  })

  it('shows only public accounts in Discover, never my own videos', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    const cai = await registerUser('cai')
    await uploadVideo(ana, 'Ana public')
    await uploadVideo(ben, 'Ben private')
    await uploadVideo(cai, 'Cai mine')
    await goPrivate(ben)
    await api().put('/users/ben/follow').set(...bearer(cai)).expect(200)
    await api().put('/users/me/follow-requests/cai').set(...bearer(ben)).expect(200)

    expect((await feed('?scope=discover', cai)).map((item) => item.title)).toEqual(['Ana public'])
    expect((await feed('?scope=discover')).map((item) => item.title).sort()).toEqual(['Ana public', 'Cai mine'])
    // The main feed still shows a private account to its approved followers.
    expect((await feed('', cai)).map((item) => item.title).sort()).toEqual(['Ana public', 'Ben private', 'Cai mine'])
  })
})
