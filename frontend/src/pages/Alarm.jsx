import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startAlarm, stopAlarm, isAlarmPlaying } from '../../utils/alarm'
import API from '../services/api'

const Alarm = () => {
  const navigate = useNavigate()
  const [playing, setPlaying] = useState(false)
  const [medId, setMedId] = useState(null)
  const [medicineName, setMedicineName] = useState('Your Medicine')
  const [loading, setLoading] = useState(null) // tracks which button is loading

  useEffect(() => {
    // Get medId passed from service worker via sessionStorage or URL param
    const storedMedId = sessionStorage.getItem('alarmMedId')
    const storedName = sessionStorage.getItem('alarmMedicineName')
    if (storedMedId) setMedId(storedMedId)
    if (storedName) setMedicineName(storedName)

    // Also listen for postMessage from sw.js START_ALARM
    const handleMessage = (event) => {
      if (event.data?.type === 'START_ALARM') {
        if (event.data.medId) setMedId(event.data.medId)
        if (event.data.medicineName) setMedicineName(event.data.medicineName)
        sessionStorage.setItem('alarmMedId', event.data.medId || '')
        sessionStorage.setItem('alarmMedicineName', event.data.medicineName || '')
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleMessage)

    startAlarm()

    const interval = setInterval(() => {
      setPlaying(isAlarmPlaying())
    }, 500)

    return () => {
      clearInterval(interval)
      stopAlarm()
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleSnooze = async (minutes) => {
    setLoading(`snooze-${minutes}`)
    try {
      if (medId) {
        await API.post('/api/alarm/snooze', { medId, minutes })
      }
    } catch (err) {
      console.log('Snooze error:', err.message)
    } finally {
      stopAlarm()
      setPlaying(false)
      setLoading(null)
      navigate('/dashboard')
    }
  }

  const handleTaken = async () => {
    setLoading('taken')
    try {
      if (medId) {
        await API.post('/api/alarm/status', { medId, status: 'Taken' })
      }
    } catch (err) {
      console.log('Taken error:', err.message)
    } finally {
      stopAlarm()
      sessionStorage.removeItem('alarmMedId')
      sessionStorage.removeItem('alarmMedicineName')
      setLoading(null)
      navigate('/dashboard')
    }
  }

  const handleSkipped = async () => {
    setLoading('skipped')
    try {
      if (medId) {
        await API.post('/api/alarm/status', { medId, status: 'Missed' })
      }
    } catch (err) {
      console.log('Skip error:', err.message)
    } finally {
      stopAlarm()
      sessionStorage.removeItem('alarmMedId')
      sessionStorage.removeItem('alarmMedicineName')
      setLoading(null)
      navigate('/dashboard')
    }
  }

  const handleStop = () => {
    stopAlarm()
    setPlaying(false)
    navigate('/dashboard')
  }

  const btnBase = {
    padding: '14px 24px',
    border: 'none',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    transition: 'opacity 0.15s',
    minWidth: 120,
  }

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '0 24px',
      textAlign: 'center',
    }}>

      {/* Pulsing icon */}
      <div style={{
        width: 100, height: 100,
        background: 'rgba(239,68,68,0.2)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
        animation: playing ? 'pulse 1s infinite' : 'none',
      }}>
        <span style={{ fontSize: 48 }}>💊</span>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        ⏰ Time to Take Medicine
      </h1>

      <p style={{ fontSize: 20, color: '#14b8a6', fontWeight: 700, marginBottom: 6 }}>
        {medicineName}
      </p>

      <p style={{
        fontSize: 14, color: '#94a3b8', marginBottom: 36,
      }}>
        {playing ? '🔔 Alarm is ringing...' : '🔕 Alarm stopped'}
      </p>

      {/* Main action buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleTaken}
          disabled={loading === 'taken'}
          style={{ ...btnBase, background: '#10b981', color: 'white', opacity: loading === 'taken' ? 0.6 : 1 }}
        >
          {loading === 'taken' ? 'Saving...' : '✅ Taken'}
        </button>

        <button
          onClick={handleSkipped}
          disabled={loading === 'skipped'}
          style={{ ...btnBase, background: '#64748b', color: 'white', opacity: loading === 'skipped' ? 0.6 : 1 }}
        >
          {loading === 'skipped' ? 'Saving...' : '⏭ Skip'}
        </button>

        <button
          onClick={handleStop}
          style={{ ...btnBase, background: '#ef4444', color: 'white' }}
        >
          🛑 Stop
        </button>
      </div>

      {/* Snooze buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[15, 30, 60].map(min => (
          <button
            key={min}
            onClick={() => handleSnooze(min)}
            disabled={!!loading}
            style={{
              ...btnBase,
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              border: '1.5px solid rgba(245,158,11,0.3)',
              fontSize: 13,
              padding: '10px 18px',
              minWidth: 90,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading === `snooze-${min}` ? '...' : `⏱ ${min} min`}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: '#475569' }}>
        Snooze will remind you again after the selected time
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

export default Alarm
