import React, { useEffect, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import { Bell, Mail, Clock } from 'lucide-react'
import Navbar from '../components/NavBar'
import API from '../services/api'
import { enableNotifications } from '../components/EnableNotifications'

const RemainderPage = () => {
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        if (user?.isGuest) { setLoading(false); return }
        const res = await API.get(`/medications?userId=${user._id}`)
        setMedications(
          Array.isArray(res.data.medications)
            ? res.data.medications
            : []
        )      
      } catch (error) {
        console.log(error)
        toast.error('Failed to load medications')
        setMedications([])
      } finally {
        setLoading(false)
      }
    }
    fetchMedications()
  }, [])

  const scheduleReminder = (med) => {
    if (!med.reminderTime) {
      toast.warning('No reminder time set for this medication')
      return
    }
    Notification.requestPermission().then((perm) => {
      if (perm !== 'granted') {
        toast.error('Please allow notifications in your browser')
        return
      }
      const [timePart, ampm] = med.reminderTime.split(' ')
      const [h, m] = timePart.split(':').map(Number)
      let hours = h
      if (ampm === 'PM' && h !== 12) hours += 12
      if (ampm === 'AM' && h === 12) hours = 0
      const now = new Date()
      const reminderDate = new Date()
      reminderDate.setHours(hours, m, 0, 0)
      if (reminderDate <= now) reminderDate.setDate(reminderDate.getDate() + 1)
      const delay = reminderDate.getTime() - now.getTime()
      const minutesUntil = Math.round(delay / 60000)
      setTimeout(() => {
        new Notification(`Time to take: ${med.medicineName}`, {
          body: `Dosage: ${med.dosage} — ${med.form}`,
        })
      }, delay)
      toast.success(`Browser reminder set for ${med.medicineName} at ${med.reminderTime} (~${minutesUntil} mins)`)
    })
  }

  const scheduleEmailReminder = async (med) => {
    if (!med.reminderTime) {
      toast.warning('No reminder time set for this medication')
      return
    }
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      await API.post('/api/medications/remind', {
        medicineName: med.medicineName,
        dosage: med.dosage,
        form: med.form,
        reminderTime: med.reminderTime,
        userEmail: user.email,
      })
      toast.success(`Email reminder set for ${med.medicineName} at ${med.reminderTime}`)
    } catch (error) {
      console.log(error)
      toast.error('Failed to set email reminder')
    }
  }

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <div className="spinner-border" style={{ color: '#14B8A6', width: 36, height: 36 }} />
      </div>
    </>
  )

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (user?.isGuest) return (
    <>
      <Navbar />
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, background: '#F0FDFA', borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Bell size={32} color="#0D9488" />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
          Reminders unavailable in Guest Mode
        </h3>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          Create an account to set email and browser reminders.
        </p>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '32px 24px', minHeight: '100vh',
        background: '#F8FAFC',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            Reminders
          </h2>
          <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
            {medications.length} medication{medications.length !== 1 ? 's' : ''} · Emails auto-send 10 mins before scheduled time
          </p>
        </div>

        {/* Info Banner */}
        <div style={{
          background: '#F0FDFA', border: '1px solid #99F6E4',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 28,
        }}>
          <Bell size={18} color="#0D9488" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: '#0F766E', lineHeight: 1.5 }}>
            <strong>Auto reminders are active.</strong> 
          </p>
        </div>

        {medications.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 16,
            border: '1px solid #E2E8F0', padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{
              width: 72, height: 72, background: '#F0FDFA', borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Bell size={32} color="#0D9488" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              No medications found
            </h3>
            <p style={{ color: '#64748B', fontSize: 14 }}>
              Add medications with a reminder time to see them here.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {medications.map((med) => (
              <div key={med._id} style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 16, padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column',
              }}>

                {/* Card Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: 14,
                }}>
                  <div>
                    <h4 style={{
                      fontSize: 16, fontWeight: 700,
                      color: '#0F172A', margin: '0 0 4px',
                    }}>
                      {med.medicineName}
                    </h4>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                      {med.dosage} · {med.form}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20,
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                    background: med.status === 'Taken' ? '#ECFDF5' :
                                med.status === 'Missed' ? '#FFF1F2' : '#FFFBEB',
                    color: med.status === 'Taken' ? '#10B981' :
                           med.status === 'Missed' ? '#F43F5E' : '#F59E0B',
                  }}>
                    {med.status}
                  </span>
                </div>

                {/* Reminder Time */}
                <div style={{
                  background: med.reminderTime ? '#F0FDFA' : '#F8FAFC',
                  border: `1px solid ${med.reminderTime ? '#99F6E4' : '#E2E8F0'}`,
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 16,
                }}>
                  <Clock size={16} color={med.reminderTime ? '#0D9488' : '#94A3B8'} />
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: med.reminderTime ? '#0D9488' : '#94A3B8',
                  }}>
                    {med.reminderTime || 'No reminder time set'}
                  </span>
                </div>

                {/* Auto reminder badge */}
                {med.reminderTime && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 14,
                    fontSize: 12, color: '#0D9488',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#0D9488',
                      animation: 'pulse 2s infinite',
                    }} />
                    Auto email scheduled 10 mins before
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => scheduleReminder(med)}
                    style={{
                      height: 42, background: '#FFFBEB',
                      color: '#D97706', border: '1px solid #FDE68A',
                      borderRadius: 10, fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <Bell size={15} /> Set Browser Reminder
                  </button>
                  <button
                    onClick={() => scheduleEmailReminder(med)}
                    style={{
                      height: 42,
                      background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
                      color: 'white', border: 'none',
                      borderRadius: 10, fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 2px 8px rgba(13,148,136,0.25)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <Mail size={15} /> Send Email Reminder Now
                  </button>

                    <button onClick={() => enableNotifications(user._id)}>
                      🔔 Enable Notifications
                    </button>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer position="top-right" />
    </>
  )
}

export default RemainderPage