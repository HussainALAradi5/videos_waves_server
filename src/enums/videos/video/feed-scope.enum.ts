/**
 * all: every video the viewer may see. following: only people the viewer follows (sign-in required).
 * discover: public accounts only, never the viewer's own (Instagram's Explore).
 */
export enum FeedScope {
  ALL = 'all',
  FOLLOWING = 'following',
  DISCOVER = 'discover'
}
