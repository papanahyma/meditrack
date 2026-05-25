// frontend/src/utils/push.js
// Used by Profile.jsx "Enable Push Notifications" button

import API from '../src/services/api.js'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export const enableNotifications = async (userId) => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser')
      return false
    }

    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Enable them in your browser settings: Settings → Site permissions → Notifications')
      return false
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Please allow notifications to continue')
        return false
      }
    }

    // Register SW if not already
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Reuse existing subscription or create new
    let subscription = await reg.pushManager.getSubscription()

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        )
      })
    }

    await API.post('/push/subscribe', { userId, subscription })

    // Update session flag
    sessionStorage.setItem('pushSaved', 'true')

    console.log('✅ Push notifications enabled')
    return true

  } catch (err) {
    console.error('Push subscribe error:', err)
    alert('Failed to enable notifications: ' + err.message)
    return false
  }
}
