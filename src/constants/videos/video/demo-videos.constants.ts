/**
 * Development-only demo content. Each clip is linked from where its licence allows it to be hosted,
 * so seeding stores no files. Licences: CC0 (MDN interactive examples) and CC BY 3.0 (Blender Foundation).
 */
export const DEMO_VIDEOS = [
  {
    ownerUserName: 'admin',
    title: 'Spring flower in the breeze',
    description: 'A short CC0 clip from the MDN interactive examples.',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    mimeType: 'video/mp4'
  },
  {
    ownerUserName: 'viewer',
    title: 'Friday night lights',
    description: 'A short CC0 clip from the MDN interactive examples.',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    mimeType: 'video/mp4'
  },
  {
    ownerUserName: 'admin',
    title: 'Big Buck Bunny (10 s)',
    description: '(c) Blender Foundation, www.bigbuckbunny.org, CC BY 3.0.',
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    mimeType: 'video/mp4'
  },
  {
    ownerUserName: 'viewer',
    title: 'Sintel (10 s)',
    description: '(c) Blender Foundation, durian.blender.org, CC BY 3.0.',
    url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
    mimeType: 'video/mp4'
  }
] as const
