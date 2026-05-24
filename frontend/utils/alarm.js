// utils/alarm.js
let audio = null
let isPlaying = false
let snoozeTimeout = null

export const startAlarm = async () => {
  if (isPlaying) return

  if (snoozeTimeout) {
    clearTimeout(snoozeTimeout)
    snoozeTimeout = null
  }

  audio = new Audio('/alarm.mp3')
  audio.loop = true
  audio.volume = 1.0

  try {
    await audio.play()
    isPlaying = true
    console.log('Alarm started')
  } catch (err) {
    console.log("Autoplay blocked:", err)
    isPlaying = false
  }
}

export const stopAlarm = () => {
  if (snoozeTimeout) {
    clearTimeout(snoozeTimeout)
    snoozeTimeout = null
  }

  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }

  isPlaying = false
  audio = null
  console.log('Alarm stopped')
}

export const snoozeAlarm = (minutes) => {
  stopAlarm()
  console.log(`Snoozed for ${minutes} minutes`)

  snoozeTimeout = setTimeout(() => {
    startAlarm()
  }, minutes * 60 * 1000)
}

export const isAlarmPlaying = () => isPlaying

// Expose for console testing
if (typeof window!== 'undefined') {
  window.startAlarm = startAlarm
  window.stopAlarm = stopAlarm
  window.snoozeAlarm = snoozeAlarm
}