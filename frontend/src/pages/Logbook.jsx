import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/NavBar'
import API from '../services/api'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Pill } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const STATUS_STYLE = {
  Taken:   { color: '#10b981', bg: '#d1fae5', icon: <CheckCircle size={12} /> },
  Missed:  { color: '#ef4444', bg: '#fee2e2', icon: <XCircle size={12} /> },
  Pending: { color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={12} /> },
}

const Logbook = () => {
  const navigate = useNavigate()
  const [logbook, setLogbook] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user._id) { navigate('/'); return }
    API.get(`/medications/logbook?userId=${user._id}`)
      .then(res => setLogbook(res.data.logbook || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Calendar helpers ──────────────────────────────────────────
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const dateKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  const getDayStatus = (key) => {
    const entries = logbook[key]
    if (!entries || entries.length === 0) return null
    const taken = entries.filter(e => e.status === 'Taken').length
    const missed = entries.filter(e => e.status === 'Missed').length
    if (taken > 0 && missed === 0) return 'all-taken'
    if (taken > 0 && missed > 0) return 'partial'
    if (missed > 0) return 'all-missed'
    return 'pending'
  }

  const getDayColor = (status) => {
    if (status === 'all-taken') return { bg: '#d1fae5', color: '#10b981', border: '#a7f3d0' }
    if (status === 'partial')   return { bg: '#fef3c7', color: '#f59e0b', border: '#fde68a' }
    if (status === 'all-missed')return { bg: '#fee2e2', color: '#ef4444', border: '#fecdd3' }
    if (status === 'pending')   return { bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' }
    return null
  }

  const today = new Date()
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())
  const selectedEntries = selectedDate ? (logbook[selectedDate] || []) : []

  // Build calendar grid
  const calendarCells = []
  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: prevMonthDays - i, currentMonth: false })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, currentMonth: true })
  }
  // Next month leading days
  const remaining = 42 - calendarCells.length
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({ day: d, currentMonth: false })
  }

  // Stats for current month
  const monthStats = { taken: 0, missed: 0, pending: 0, total: 0 }
  for (let d = 1; d <= daysInMonth; d++) {
    const k = dateKey(year, month, d)
    const entries = logbook[k] || []
    entries.forEach(e => {
      monthStats.total++
      if (e.status === 'Taken') monthStats.taken++
      else if (e.status === 'Missed') monthStats.missed++
      else monthStats.pending++
    })
  }
  const monthAdherence = monthStats.total
    ? Math.round((monthStats.taken / monthStats.total) * 100) : 0

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <div className="spinner-border" style={{ color: '#0d9488' }} />
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            📅 Medication Logbook
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Full history of your taken and missed doses
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Left: Calendar */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

            {/* Month nav */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={20} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {MONTHS[month]} {year}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {monthAdherence}% adherence · {monthStats.taken} taken · {monthStats.missed} missed
                </div>
              </div>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '12px 16px 0' }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9ca3af', paddingBottom: 8 }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '0 12px 16px' }}>
              {calendarCells.map((cell, i) => {
                if (!cell.currentMonth) {
                  return <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: 13, color: '#9ca3af' }}>{cell.day}</div>
                }
                const k = dateKey(year, month, cell.day)
                const status = getDayStatus(k)
                const colors = getDayColor(status)
                const isToday = k === todayKey
                const isSelected = k === selectedDate
                const entries = logbook[k] || []

                return (
                  <div key={i}
                    onClick={() => setSelectedDate(isSelected ? null : k)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, cursor: entries.length > 0 ? 'pointer' : 'default',
                      background: isSelected ? '#0d9488' : colors ? colors.bg : 'transparent',
                      border: isToday ? '2px solid #0d9488' : isSelected ? '2px solid #0d9488' : colors ? `1px solid ${colors.border}` : '1px solid transparent',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: isToday ? 800 : 500,
                      color: isSelected ? 'white' : colors ? colors.color : 'var(--text-primary)',
                    }}>
                      {cell.day}
                    </span>
                    {entries.length > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: isSelected ? 'rgba(255,255,255,0.8)' : colors?.color,
                      }}>
                        {entries.length}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { color: '#10b981', bg: '#d1fae5', label: 'All taken' },
                { color: '#f59e0b', bg: '#fef3c7', label: 'Partial' },
                { color: '#ef4444', bg: '#fee2e2', label: 'Missed' },
                { color: '#7c3aed', bg: '#ede9fe', label: 'Pending' },
              ].map(({ color, bg, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1px solid ${color}` }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Day detail */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'long' })
                  : 'Select a day'}
              </h3>
              {selectedDate && (
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  {selectedEntries.length} dose{selectedEntries.length !== 1 ? 's' : ''} logged
                </p>
              )}
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 420 }}>
              {!selectedDate ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                  <p style={{ fontSize: 13 }}>Click any date on the calendar to see dose details</p>
                </div>
              ) : selectedEntries.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                  <Pill size={28} color="#e5e7eb" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13 }}>No doses logged for this day</p>
                </div>
              ) : (
                selectedEntries.map((entry, i) => {
                  const ss = STATUS_STYLE[entry.status] || STATUS_STYLE.Pending
                  return (
                    <div key={i} style={{
                      padding: '14px 20px',
                      borderBottom: i < selectedEntries.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {entry.medicineName}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            {entry.dosage} · {entry.form}
                          </div>
                          {entry.reminderTime && (
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                              🕐 {entry.reminderTime}
                            </div>
                          )}
                          {entry.timestamp && (
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                              Logged at {new Date(entry.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                            </div>
                          )}
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: ss.bg, color: ss.color,
                          padding: '4px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {ss.icon} {entry.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Monthly summary */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: '#fafafa' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>This month</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[
                  { label: 'Taken', value: monthStats.taken, color: '#10b981', bg: '#d1fae5' },
                  { label: 'Missed', value: monthStats.missed, color: '#ef4444', bg: '#fee2e2' },
                  { label: 'Rate', value: `${monthAdherence}%`, color: '#0d9488', bg: '#f0fdfa' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export PDF button */}
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <a href={`${API_URL}/api/medications/export-pdf?userId=${user._id}`}
            target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#0d9488', color: 'white',
              padding: '10px 24px', borderRadius: 10,
              fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}
          >
            📄 Export PDF Report
          </a>
        </div>

      </div>
    </>
  )
}

export default Logbook
