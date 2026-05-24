import webpush from 'web-push'

export const vapidKeys = webpush.generateVAPIDKeys()

webpush.setVapidDetails(
  'mailto:your-email@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

export default webpush