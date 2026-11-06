/** Every user setting, by key. Clients read and write settings by these keys. */
export enum SettingKey {
  THEME = 'theme',
  AUTOPLAY_VIDEOS = 'autoplayVideos',
  SHOW_ACTIVITY_STATUS = 'showActivityStatus',
  READ_RECEIPTS = 'readReceipts',
  MESSAGE_PERMISSION = 'messagePermission',
  MESSAGE_PREVIEWS = 'messagePreviews',
  MESSAGE_SOUND = 'messageSound',
  BUBBLE_COLOR = 'bubbleColor',
  OTHERS_BUBBLE_COLOR = 'othersBubbleColor',
  BUBBLE_STYLE = 'bubbleStyle',
  NOTIFY_MESSAGES = 'notifyMessages',
  PRESENCE = 'presence',
  STATUS_TEXT = 'statusText',
  PRIVATE_ACCOUNT = 'privateAccount'
}
