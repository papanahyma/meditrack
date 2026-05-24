self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event =>
  event.waitUntil(self.clients.claim())
)

self.addEventListener('push', event => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'MediTrack', body: event.data.text() }
  }

  const title = data.title || 'MediTrack Reminder'
  const options = {
    body: data.body || 'Time to take your medicine',
    icon: '/icon-192.png',
    badge: '/badge.png',
    tag: data.medId ? `alarm-${data.medId}` : 'medicine-reminder',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    data: {
      medId: data.medId || null,
      url: data.medId ? '/alarm' : '/dashboard'
    }
  }

  event.waitUntil(
    Promise.all([
      // Show the notification
      self.registration.showNotification(title, options),

      // Send message to all open tabs so alarm page can play audio
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientsArr => {
          clientsArr.forEach(client => {
            client.postMessage({
              type: 'START_ALARM',
              medId: data.medId,
              medicineName: data.body
            })
          })
        })
    ])
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientsArr => {
        // If app is already open, focus it
        for (const client of clientsArr) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(targetUrl)
            return
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

// Handle notification close (dismissed without clicking)
self.addEventListener('notificationclose', event => {
  const medId = event.notification.data?.medId
  if (medId) {
    // Notify open tabs that notification was dismissed
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientsArr => {
        clientsArr.forEach(client => {
          client.postMessage({ type: 'NOTIFICATION_DISMISSED', medId })
        })
      })
  }
})
