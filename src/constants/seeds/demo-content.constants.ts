import { BubbleColor } from '../../enums/users/settings/bubble-color.enum'
import { BubbleStyle } from '../../enums/users/settings/bubble-style.enum'
import { PresenceMode } from '../../enums/users/settings/presence-mode.enum'
import type { SettingsValues } from '../../interfaces/models/users/settings/settings-values.interface'
/** Who follows whom in the demo: `[follower, following]`. */
export const DEMO_FOLLOWS = [
  ['viewer', 'admin'],
  ['viewer', 'lina'],
  ['lina', 'viewer'],
  ['lina', 'admin'],
  ['lina', 'omar'],
  ['omar', 'admin'],
  ['omar', 'lina'],
  ['maya', 'admin'],
  ['maya', 'lina'],
  ['moderator', 'admin'],
  ['admin', 'viewer'],
  ['admin', 'lina']
] as const

/** Comments on the demo videos; a reply by the video's owner shows the Owner badge. */
export const DEMO_COMMENTS = [
  {
    videoTitle: 'Sintel (10 s)',
    author: 'lina',
    content: 'This looks amazing on my phone!',
    replies: [{ author: 'viewer', content: 'Thank you! More waves coming soon.' }]
  },
  {
    videoTitle: 'Big Buck Bunny (10 s)',
    author: 'maya',
    content: 'The bunny never gets old.',
    replies: [{ author: 'omar', content: 'Classic. Full version next week.' }]
  },
  {
    videoTitle: 'Spring flower in the breeze',
    author: 'omar',
    content: 'So calm. Slow motion next time?',
    replies: [{ author: 'admin', content: 'Noted! Welcome to Videos Waves.' }]
  }
] as const

/** A direct chat, a group, and one message request (maya does not follow omar). */
export const DEMO_CHATS = {
  direct: {
    from: 'viewer',
    to: 'lina',
    messages: [
      { author: 'viewer', body: 'Did you see the new Sintel clip?' },
      { author: 'lina', body: 'Yes! Just left a comment.' },
      { author: 'viewer', body: 'Coffee and editing on Friday?' }
    ]
  },
  group: {
    title: 'Wave makers',
    admin: 'admin',
    members: ['lina', 'omar', 'maya'],
    messages: [
      { author: 'admin', body: 'Welcome to the group! Share what you are working on.' },
      { author: 'omar', body: 'Animating a 10-second loop right now.' },
      { author: 'maya', body: 'Posting a slow-motion flower clip tonight.' }
    ],
    reaction: { author: 'lina', emoji: '🔥' }
  },
  request: { from: 'omar', to: 'maya', body: 'Hi Maya, loved your flower idea. Collab?' }
} as const

/** Demo preferences that show off status, private accounts, and chat looks (applied after the chats). */
export const DEMO_SETTINGS: Record<string, Partial<SettingsValues>> = {
  viewer: { presence: PresenceMode.ONLINE, statusText: 'Watching short films' },
  lina: { bubbleColor: BubbleColor.OCEAN, othersBubbleColor: BubbleColor.FOREST, bubbleStyle: BubbleStyle.SQUARE },
  omar: { presence: PresenceMode.BUSY, statusText: 'In class until 4' },
  // A private account: people who do not follow maya see the lock and must send a request.
  maya: { presence: PresenceMode.AWAY, statusText: 'Editing a timelapse', privateAccount: true, bubbleStyle: BubbleStyle.MINIMAL }
}
