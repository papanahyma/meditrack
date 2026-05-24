import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register SW + request permission
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('SW registered:', reg)
  })
}

// Listen for SW messages to start alarm
navigator.serviceWorker.addEventListener('message', async (event) => {
  if (event.data?.type === 'START_ALARM') {

    // Start sound
    const module = await import('../utils/alarm.js')
    module.startAlarm()

    // Save current medicine ID if needed
    if (event.data.medId) {
      window.currentMedId = event.data.medId
    }

    // Auto open alarm page
    window.location.href = '/alarm'

    console.log('🔔 Alarm triggered automatically')
  }
})