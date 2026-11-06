import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerAdmin, registerUser, uploadVideo } from '../../../helpers/api.helper'

describe('video endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('requires authentication to upload', async () => {
    await api().post('/videos').field('title', 'x').expect(401)
  })

  it('rejects files that are not videos', async () => {
    const session = await registerUser('uploader')
    const response = await api()
      .post('/videos')
      .set(...bearer(session))
      .field('title', 'Not a video')
      .attach('file', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' })
      .expect(415)
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })

  it('rejects files over the size limit with 413', async () => {
    const session = await registerUser('big')
    await api()
      .post('/videos')
      .set(...bearer(session))
      .field('title', 'Too big')
      .attach('file', Buffer.alloc(2 * 1024 * 1024), { filename: 'big.mp4', contentType: 'video/mp4' })
      .expect(413)
  })

  it('uploads, lists with page metadata, and streams the file', async () => {
    const session = await registerUser('creator')
    const video = await uploadVideo(session, 'Ocean sunrise')
    expect(video).toMatchObject({ title: 'Ocean sunrise', likesCount: 0, isLiked: false })
    expect(video.owner.userName).toBe('creator')

    const list = await api().get('/videos?pageSize=5').expect(200)
    expect(list.body.meta).toEqual({ page: 1, pageSize: 5, totalItems: 1, totalPages: 1 })

    const mediaPath = new URL(video.videoUrl).pathname
    await api().get(mediaPath).expect(200)
  })

  it('searches by title and rejects oversized pages', async () => {
    const session = await registerUser('searcher')
    await uploadVideo(session, 'Big wave surfing')
    await uploadVideo(session, 'Mountain hike')
    const found = await api().get('/videos?search=wave').expect(200)
    expect(found.body.data).toHaveLength(1)
    await api().get('/videos?pageSize=500').expect(400)
  })

  it('likes idempotently and reports isLiked for the viewer', async () => {
    const owner = await registerUser('owner')
    const fan = await registerUser('fan')
    const video = await uploadVideo(owner)

    await api().put(`/videos/${video.id}/like`).set(...bearer(fan)).expect(200)
    const second = await api().put(`/videos/${video.id}/like`).set(...bearer(fan)).expect(200)
    expect(second.body.data).toEqual({ videoId: video.id, isLiked: true, likesCount: 1 })

    const asFan = await api().get(`/videos/${video.id}`).set(...bearer(fan)).expect(200)
    expect(asFan.body.data.isLiked).toBe(true)
    const anonymous = await api().get('/videos').expect(200)
    expect(anonymous.body.data[0].isLiked).toBe(false)

    const unliked = await api().delete(`/videos/${video.id}/like`).set(...bearer(fan)).expect(200)
    expect(unliked.body.data.likesCount).toBe(0)
    const again = await api().delete(`/videos/${video.id}/like`).set(...bearer(fan)).expect(200)
    expect(again.body.data.likesCount).toBe(0)
  })

  it('lets only the owner or an admin update and delete', async () => {
    const owner = await registerUser('owner2')
    const stranger = await registerUser('stranger')
    const admin = await registerAdmin('moderator')
    const video = await uploadVideo(owner)

    await api().patch(`/videos/${video.id}`).set(...bearer(stranger)).send({ title: 'Hijacked' }).expect(403)
    await api().patch(`/videos/${video.id}`).set(...bearer(owner)).send({ title: 'Renamed' }).expect(200)
    await api().delete(`/videos/${video.id}`).set(...bearer(stranger)).expect(403)
    await api().delete(`/videos/${video.id}`).set(...bearer(admin)).expect(200)

    await api().get(`/videos/${video.id}`).expect(404)
    await api().get(new URL(video.videoUrl).pathname).expect(404)
  })

  it('rejects mass assignment of counters on update', async () => {
    const owner = await registerUser('cheater')
    const video = await uploadVideo(owner)
    await api().patch(`/videos/${video.id}`).set(...bearer(owner)).send({ likesCount: 9999 }).expect(400)
  })

  it('counts views and validates ids', async () => {
    const owner = await registerUser('viewed')
    const video = await uploadVideo(owner)
    await api().post(`/videos/${video.id}/views`).expect(200)
    const detail = await api().get(`/videos/${video.id}`).expect(200)
    expect(detail.body.data.viewsCount).toBe(1)
    await api().get('/videos/not-an-id').expect(400)
  })
})
