/** What a notification is about; each kind has its own icon and colour in the clients. */
export enum NotificationKind {
  FOLLOW = 'follow',
  FOLLOW_REQUEST = 'follow_request',
  FOLLOW_ACCEPTED = 'follow_accepted',
  LIKE = 'like',
  COMMENT = 'comment',
  REPLY = 'reply',
  GROUP_ADDED = 'group_added',
  ADMIN_ACCEPTED = 'admin_accepted',
  ADMIN_REJECTED = 'admin_rejected'
}
