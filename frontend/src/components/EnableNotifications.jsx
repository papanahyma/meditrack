import API from '../services/api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export const enableNotifications = async (userId) => {
  try {
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      alert('Please allow notifications')
      return
    }

    const registration = await navigator.serviceWorker.register('/sw.js')

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
    })

    await API.post('/push/subscribe', {
      userId,
      subscription
    })

    alert('Notifications enabled 🔔')
  } catch (err) {
    console.log(err)
    alert('Failed to enable notifications')
  }
}