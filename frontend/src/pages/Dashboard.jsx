import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Package, TrendingUp, Pill, ChevronRight, AlertTriangle } from 'lucide-react'
import Navbar from '../components/NavBar'
import API from '../services/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [greeting, setGreeting] = useState('')

useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const userStr = localStorage.getItem('user')
    if (!userStr) { navigate('/'); return }

    const user = JSON.parse(userStr)
    if (user?.isGuest) { setIsGuest(true); setLoading(false); return }

    API.get(`/medications/dashboard/stats?userId=${user._id}`) // Fixed: added /dashboard
     .then(res => {
        setStats(res.data || {})
        setStreak(res.data.streak?.count || 0)
      })
     .catch(() => setError('Failed to load dashboard data.'))
     .finally(() => setLoading(false))
}, [navigate])


  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border" style={{ color: '#14B8A6', width: 40, height: 40 }} />
          <p style={{ color: '#64748B', marginTop: 16, fontSize: 14 }}>Loading your health data...</p>
        </div>
      </div>
    </>
  )

  if (isGuest) return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80,
          background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
          borderRadius: 24, margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Pill size={36} color="white" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          Guest Mode
        </h2>
        <p style={{ color: '#64748B', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
          You're exploring MediTrack as a guest. Create a free account to save your medications and enable all features.
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '14px 32px', fontWeight: 700, fontSize: 15,
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(13,148,136,0.3)',
          }}
        >
          Create Free Account
        </button>
      </div>
    </>
  )

  if (error || !stats) return (
    <>
      <Navbar />
      <div style={{ padding: 32 }}>
        <div style={{
          background: '#FFF1F2', border: '1px solid #FECDD3',
          borderRadius: 12, padding: '16px 20px', color: '#9F1239',
        }}>
          {error || 'Failed to load data'}
        </div>
      </div>
    </>
  )

  const statCards = [
    {
      label: 'Total Medications',
      value: stats.total,
      icon: <Pill size={22} color="#0D9488" />,
      color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4',
      onClick: () => navigate('/medications'),
    },
    {
      label: 'Taken Today',
      value: stats.taken,
      icon: <CheckCircle size={22} color="#10B981" />,
      color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0',
    },
    {
      label: 'Missed Doses',
      value: stats.missed,
      icon: <XCircle size={22} color="#F43F5E" />,
      color: '#F43F5E', bg: '#FFF1F2', border: '#FECDD3',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <Clock size={22} color="#F59E0B" />,
      color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A',
    },
    {
      label: 'Low Stock',
      value: stats.lowStock,
      icon: <AlertTriangle size={22} color="#6366F1" />,
      color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE',
      onClick: () => navigate('/inventory'),
    },
    {
      label: 'Adherence Rate',
      value: `${stats.adherence}%`,
      icon: <TrendingUp size={22} color="#0D9488" />,
      color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4',
      onClick: () => navigate('/analytics'),
    },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 60%, #2DD4BF 100%)',
          borderRadius: 20, padding: '28px 32px',
          marginBottom: 28, color: 'white',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
            top: -60, right: -40,
          }} />
          <div style={{
            position: 'absolute', width: 120, height: 120,
            borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
            bottom: -30, right: 120,
          }} />
          <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 4 }}>{greeting},</p>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
            {user.name || 'Welcome back'}
          </h2>
          <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 0 }}>
            Here's your medication summary for today.
          </p>
          <button
            onClick={() => navigate('/add-medication')}
            style={{
              marginTop: 20, background: 'rgba(255,255,255,0.2)',
              color: 'white', border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: 10, padding: '9px 20px',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Pill size={15} /> Add Medication
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16, marginBottom: 28,
        }}>
          {statCards.map((card, i) => (
            <div
              key={i}
              onClick={card.onClick}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid var(--border)`,
                borderRadius: 16,
                padding: '20px',
                cursor: card.onClick ? 'pointer' : 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
              }}
              onMouseEnter={e => {
                if (card.onClick) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{
                width: 44, height: 44, background: card.bg,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
                border: `1px solid ${card.border}`,
              }}>
                {card.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1, marginBottom: 6 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Adherence + Recent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 28 }}
          className="flex-column-mobile">

          {/* Adherence */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16,
            border: '1px solid var(--border)',
            padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Adherence Rate
            </h3>

            {/* Circle indicator */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={stats.adherence >= 75 ? '#10B981' : stats.adherence >= 50 ? '#F59E0B' : '#F43F5E'}
                  strokeWidth="10"
                  strokeDasharray={`${(stats.adherence / 100) * 314} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
                <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--text-primary)">
                  {stats.adherence}%
                </text>
                <text x="60" y="74" textAnchor="middle" fontSize="11" fill="var(--text-secondary)">
                  adherence
                </text>
              </svg>
            </div>

            <p style={{
              textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.6, margin: 0,
            }}>
              {stats.adherence >= 75
                ? 'Excellent! Keep up the great work.'
                : stats.adherence >= 50
                ? 'Good progress. Try to be more consistent.'
                : 'Needs improvement. Take your medications regularly.'}
            </p>
          </div>

          {/* Recent Medications */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16,
            border: '1px solid var(--border)',
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Recent Medications
              </h3>
              <button
                onClick={() => navigate('/medications')}
                style={{
                  background: 'none', border: 'none',
                  color: '#0D9488', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            {stats.medications?.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Pill size={32} color="#E2E8F0" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>No medications added yet.</p>
                <button
                  onClick={() => navigate('/add-medication')}
                  style={{
                    marginTop: 12, background: '#0D9488', color: 'white',
                    border: 'none', borderRadius: 8, padding: '8px 20px',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Add your first medication
                </button>
              </div>
            ) : (
              <div>
                {stats.medications.slice(0, 5).map((med, i) => (
                  <div
                    key={med._id}
                    style={{
                      padding: '14px 24px',
                      borderBottom: i < Math.min(stats.medications.length, 5) - 1 ? '1px solid var(--border-light)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40,
                        background: med.status === 'Taken' ? '#ECFDF5' :
                                    med.status === 'Missed' ? '#FFF1F2' : '#FFFBEB',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Pill size={18} color={
                          med.status === 'Taken' ? '#10B981' :
                          med.status === 'Missed' ? '#F43F5E' : '#F59E0B'
                        } />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {med.medicineName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {med.dosage} · {med.form} {med.reminderTime ? `· ${med.reminderTime}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {med.inventory <= 5 && (
                        <span style={{
                          background: '#FFF1F2', color: '#F43F5E',
                          fontSize: 11, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 6,
                        }}>
                          Low stock
                        </span>
                      )}
                      <span style={{
                        padding: '4px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                        background: med.status === 'Taken' ? '#ECFDF5' :
                                    med.status === 'Missed' ? '#FFF1F2' : '#FFFBEB',
                        color: med.status === 'Taken' ? '#10B981' :
                               med.status === 'Missed' ? '#F43F5E' : '#F59E0B',
                      }}>
                        {med.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Add Medication', path: '/add-medication', color: '#0D9488', bg: '#F0FDFA' },
              { label: 'View Reminders', path: '/remainders', color: '#6366F1', bg: '#EEF2FF' },
              { label: 'Check Inventory', path: '/inventory', color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'View Analytics', path: '/analytics', color: '#10B981', bg: '#ECFDF5' },
              { label: 'Pharmacy Near Me', path: '/pharmacy', color: '#F43F5E', bg: '#FFF1F2' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                style={{
                  background: action.bg, color: action.color,
                  border: 'none', borderRadius: 10,
                  padding: '10px 18px', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer',
                  transition: 'transform 0.15s, opacity 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Streak Card */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '24px', marginTop: 28,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          <h6 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>🔥 Streak</h6>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#F59E0B', marginBottom: 6 }}>{streak}</h2>
          <small style={{ fontSize: 13, color: 'var(--text-secondary)' }}>days in a row</small>
        </div>

      </div>

    </div>
  )
}

export default Dashboard