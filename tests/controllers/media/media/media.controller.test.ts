import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerUser, uploadFile, uploadMedia } from '../../../helpers/api.helper'

const register = (session: Parameters<typeof bearer>[0], fileId: string, kind = 'video') =>
  api().post('/media').set(...bearer(session)).send({ fileId, kind })

describe('media endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('requires authentication to sign an upload', async () => {
    await api().post('/media/signature').send({ kind: 'video' }).expect(401)
  })

  it('signs uploads into a per-user folder with the rules for the kind', async () => {
    const session = await registerUser('signer')
    const response = await api().post('/media/signature').set(...bearer(session)).send({ kind: 'chat_attachment' })
    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      provider: 'local',
      folder: `/videos-waves/chat_attachment/${session.id}`,
      isPrivateFile: true
    })
  })

  it('rejects an upload with a forged signature', async () => {
    await api()
      .post('/media/local-upload')
      .field('fileName', 'clip.mp4')
      .field('folder', '/videos-waves/video/0123456789abcdef01234567')
      .field('token', 'token')
      .field('expire', String(Math.floor(Date.now() / 1000) + 60))
      .field('signature', 'forged')
      .attach('file', Buffer.from('x'), { filename: 'clip.mp4', contentType: 'video/mp4' })
      .expect(401)
  })

  it('rejects disallowed types with 415 and deletes the uploaded file', async () => {
    const session = await registerUser('typer')
    const stored = await uploadFile(session, { fileName: 'notes.txt', contentType: 'text/plain' })
    const response = await register(session, stored.fileId).expect(415)
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
    await register(session, stored.fileId).expect(404)
  })

  it('rejects files over the kind limit with 413', async () => {
    const session = await registerUser('heavy')
    const stored = await uploadFile(session, { bytes: Buffer.alloc(2 * 1024 * 1024) })
    await register(session, stored.fileId).expect(413)
  })

  it('rejects files uploaded into another user folder', async () => {
    const owner = await registerUser('victim')
    const attacker = await registerUser('attacker')
    const stored = await uploadFile(attacker, { folder: `/videos-waves/video/${owner.id}` })
    await register(attacker, stored.fileId).expect(403)
  })

  it('rejects private kinds uploaded as public files', async () => {
    const session = await registerUser('leaky')
    const stored = await uploadFile(session, { kind: 'chat_attachment', isPrivateFile: false })
    await register(session, stored.fileId, 'chat_attachment').expect(400)
  })

  it('registers a file only once', async () => {
    const session = await registerUser('replayer')
    const stored = await uploadFile(session)
    await register(session, stored.fileId).expect(201)
    await register(session, stored.fileId).expect(409)
  })

  it('serves private files only through an unexpired signed link', async () => {
    const session = await registerUser('private')
    const media = await uploadMedia(session, {
      kind: 'chat_attachment',
      fileName: 'photo.png',
      contentType: 'image/png'
    })
    const signed = new URL(media.url)
    await api().get(`${signed.pathname}${signed.search}`).expect(200)
    await api().get(signed.pathname).expect(403)
    await api().get(`${signed.pathname}?expires=1&signature=${signed.searchParams.get('signature')}`).expect(403)
  })

  it('lets the owner discard a pending upload, and nobody else', async () => {
    const owner = await registerUser('discarder')
    const other = await registerUser('meddler')
    const media = await uploadMedia(owner)
    await api().delete(`/media/${media.id}`).set(...bearer(other)).expect(403)
    await api().delete(`/media/${media.id}`).set(...bearer(owner)).expect(200)
    await api().get(new URL(media.url).pathname).expect(404)
  })
})
