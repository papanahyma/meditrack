export const subscribeUser = async (userId) => {
  if (!('serviceWorker' in navigator)) {
    console.log('Push not supported')
    return
  }

  // register service worker
  const registration = await navigator.serviceWorker.register('/sw.js')

  // get subscription
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,

    applicationServerKey: urlBase64ToUint8Array(
      'YOUR_PUBLIC_KEY_HERE'
    ),
  })

  // send to backend
  await fetch('http://localhost:5000/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      subscription,
    }),
  })
}

// helper function (IMPORTANT)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}