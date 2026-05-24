import API from '../services/api'

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
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    })

    await API.post('/api/push/subscribe', {
      userId,
      subscription
    })

    alert('Notifications enabled 🔔')
  } catch (err) {
    console.log(err)
    alert('Failed to enable notifications')
  }
}