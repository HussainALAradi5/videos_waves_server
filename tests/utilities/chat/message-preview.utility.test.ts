import { describe, expect, it } from 'vitest'
import { buildMessagePreview } from '../../../src/utilities/chat/message-preview.utility'
import { MessageKind } from '../../../src/enums/chat/message/message-kind.enum'

const base = { kind: MessageKind.TEXT, body: null, attachmentsCount: 0, isUnsent: false }

describe('buildMessagePreview', () => {
  it('collapses whitespace and truncates long text', () => {
    expect(buildMessagePreview({ ...base, body: 'hi\n  there' })).toBe('hi there')
    const preview = buildMessagePreview({ ...base, body: 'x'.repeat(200) })
    expect(preview).toHaveLength(80)
    expect(preview.endsWith('…')).toBe(true)
  })

  it('describes messages without text', () => {
    expect(buildMessagePreview({ ...base, kind: MessageKind.MEDIA, attachmentsCount: 1 })).toBe('Sent an attachment')
    expect(buildMessagePreview({ ...base, kind: MessageKind.MEDIA, attachmentsCount: 3 })).toBe('Sent attachments')
    expect(buildMessagePreview({ ...base, kind: MessageKind.VOICE })).toBe('Sent a voice message')
    expect(buildMessagePreview({ ...base, body: 'secret', isUnsent: true })).toBe('Unsent a message')
  })
})
