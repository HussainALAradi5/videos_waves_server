import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerAdmin, registerUser, uploadVideo } from '../../../helpers/api.helper'

describe('comment endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('creates, lists, and counts comments', async () => {
    const author = await registerUser('talker')
    const video = await uploadVideo(author)

    const created = await api()
      .post(`/videos/${video.id}/comments`)
      .set(...bearer(author))
      .send({ content: '  Great wave!  ' })
      .expect(201)
    expect(created.body.data).toMatchObject({ content: 'Great wave!', videoId: video.id })
    expect(created.body.data.author.userName).toBe('talker')

    const list = await api().get(`/videos/${video.id}/comments`).expect(200)
    expect(list.body.meta.totalItems).toBe(1)
    const detail = await api().get(`/videos/${video.id}`).expect(200)
    expect(detail.body.data.commentsCount).toBe(1)
  })

  it('rejects empty comments and anonymous posting', async () => {
    const author = await registerUser('quiet')
    const video = await uploadVideo(author)
    await api().post(`/videos/${video.id}/comments`).send({ content: 'hi' }).expect(401)
    await api().post(`/videos/${video.id}/comments`).set(...bearer(author)).send({ content: '   ' }).expect(400)
  })

  it('allows only the author to edit, and the author or an admin to delete', async () => {
    const author = await registerUser('writer')
    const other = await registerUser('other')
    const admin = await registerAdmin('mod')
    const video = await uploadVideo(author)
    const comment = (
      await api().post(`/videos/${video.id}/comments`).set(...bearer(author)).send({ content: 'First' }).expect(201)
    ).body.data
    const path = `/videos/${video.id}/comments/${comment.id}`

    await api().patch(path).set(...bearer(other)).send({ content: 'Edited by other' }).expect(403)
    await api().patch(path).set(...bearer(admin)).send({ content: 'Edited by admin' }).expect(403)
    const edited = await api().patch(path).set(...bearer(author)).send({ content: 'Edited' }).expect(200)
    expect(edited.body.data.content).toBe('Edited')

    await api().delete(path).set(...bearer(other)).expect(403)
    await api().delete(path).set(...bearer(admin)).expect(200)
    await api().delete(path).set(...bearer(author)).expect(404)

    const detail = await api().get(`/videos/${video.id}`).expect(200)
    expect(detail.body.data.commentsCount).toBe(0)
  })

  it('does not find a comment through a different video id', async () => {
    const author = await registerUser('crosser')
    const first = await uploadVideo(author, 'First')
    const second = await uploadVideo(author, 'Second')
    const comment = (
      await api().post(`/videos/${first.id}/comments`).set(...bearer(author)).send({ content: 'Hi' }).expect(201)
    ).body.data
    await api().delete(`/videos/${second.id}/comments/${comment.id}`).set(...bearer(author)).expect(404)
  })

  it('threads replies one level deep and marks the video owner', async () => {
    const owner = await registerUser('creator')
    const fan = await registerUser('replyfan')
    const video = await uploadVideo(owner)
    const base = `/videos/${video.id}/comments`
    const top = (await api().post(base).set(...bearer(fan)).send({ content: 'Love it' }).expect(201)).body.data
    const reply = (await api().post(base).set(...bearer(owner)).send({ content: 'Thanks!', parentId: top.id }).expect(201)).body.data
    expect(reply).toMatchObject({ parentId: top.id, isVideoOwner: true })
    // A reply to a reply joins the same top-level thread.
    const nested = (await api().post(base).set(...bearer(fan)).send({ content: 'Welcome', parentId: reply.id }).expect(201)).body.data
    expect(nested.parentId).toBe(top.id)

    const list = (await api().get(base).expect(200)).body.data
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ repliesCount: 2, isVideoOwner: false })
    const replies = (await api().get(`${base}/${top.id}/replies`).expect(200)).body.data
    expect(replies.map((comment: { content: string }) => comment.content)).toEqual(['Welcome', 'Thanks!'])
    expect((await api().get(`/videos/${video.id}`)).body.data.commentsCount).toBe(3)
  })

  it('flags edits only when the text changes', async () => {
    const author = await registerUser('editor')
    const video = await uploadVideo(author)
    const path = (id: string) => `/videos/${video.id}/comments/${id}`
    const comment = (await api().post(`/videos/${video.id}/comments`).set(...bearer(author)).send({ content: 'One' })).body.data
    expect((await api().patch(path(comment.id)).set(...bearer(author)).send({ content: 'One' })).body.data.isEdited).toBe(false)
    expect((await api().patch(path(comment.id)).set(...bearer(author)).send({ content: 'Two' })).body.data.isEdited).toBe(true)
  })

  it('lets the video owner delete, and only the deleter undo, a whole thread', async () => {
    const owner = await registerUser('postowner')
    const fan = await registerUser('chatty')
    const video = await uploadVideo(owner)
    const base = `/videos/${video.id}/comments`
    const top = (await api().post(base).set(...bearer(fan)).send({ content: 'Top' })).body.data
    await api().post(base).set(...bearer(fan)).send({ content: 'Reply', parentId: top.id })

    await api().delete(`${base}/${top.id}`).set(...bearer(owner)).expect(200)
    expect((await api().get(`/videos/${video.id}`)).body.data.commentsCount).toBe(0)
    await api().patch(`${base}/${top.id}/restore`).set(...bearer(fan)).expect(403)
    const restored = await api().patch(`${base}/${top.id}/restore`).set(...bearer(owner)).expect(200)
    expect(restored.body.data.repliesCount).toBe(1)
    expect((await api().get(`/videos/${video.id}`)).body.data.commentsCount).toBe(2)
    expect((await api().get(`${base}/${top.id}/replies`)).body.data).toHaveLength(1)
  })
})
