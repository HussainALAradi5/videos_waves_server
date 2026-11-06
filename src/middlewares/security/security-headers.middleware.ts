import helmet from 'helmet'

// Media is streamed to clients on other origins (web app, mobile), so resources must be cross-origin readable.
export const securityHeaders = helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })
