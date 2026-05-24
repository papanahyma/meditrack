import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/NavBar'
import API from '../services/api'
import { toast, ToastContainer } from 'react-toastify'
import { enableNotifications } from '../../utils/push'
import { User as UserIcon, Edit2, Check, X } from 'lucide-react'

const Profile = () => {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isGuest = storedUser?.isGuest

  const [user, setUser] = useState(storedUser)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: storedUser.name || '',
    phone: storedUser.phone || '',
    currentPassword: '',
    newPassword: '',
  })
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    if (!isGuest && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription())
        .then(sub => setIsSubscribed(!!sub))
    }
    // Fetch latest user data from server
    if (!isGuest && storedUser._id) {
      API.get(`/medications/user/${storedUser._id}`)
        .then(res => {
          const fresh = { ...storedUser, ...res.data.user }
          setUser(fresh)
          setEditForm(f => ({ ...f, name: fresh.name || '', phone: fresh.phone || '' }))
          localStorage.setItem('user', JSON.stringify(fresh))
        })
        .catch(() => {}) // silently fail, use localStorage data
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/')
  }

  const handleEnablePush = async () => {
    if (!user?._id || isGuest) {
      toast.warn('Create an account to enable notifications')
      return
    }
    setPushLoading(true)
    const success = await enableNotifications(user._id)
    setPushLoading(false)
    if (success) {
      setIsSubscribed(true)
      toast.success('Push notifications enabled!')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (editForm.newPassword && editForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setSaveLoading(true)
    try {
      const payload = { name: editForm.name, phone: editForm.phone }
      if (editForm.newPassword) {
        payload.currentPassword = editForm.currentPassword
        payload.newPassword = editForm.newPassword
      }
      const res = await API.put(`/auth/update-profile`, payload)
      const updated = { ...user, name: res.data.name, phone: res.data.phone }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      toast.success('Profile updated!')
      setEditing(false)
      setEditForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaveLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 42,
    border: '1.5px solid #E2E8F0', borderRadius: 8,
    padding: '0 12px', fontSize: 14, outline: 'none',
    background: '#F8FAFC', color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  }

  const fields = [
    { label: 'Full Name', value: user.name || '—' },
    { label: 'Email Address', value: user.email || '—' },
    { label: 'Phone Number', value: user.phone || 'Not set' },
    { label: 'Account Type', value: isGuest ? 'Guest Account' : 'Registered User' },
    { label: 'User ID', value: user._id || '—' },
  ]

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>

        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
          borderRadius: 16, padding: '40px 32px',
          display: 'flex', alignItems: 'center', gap: 24,
          marginBottom: 24, color: 'white',
        }}>
          <div style={{
            width: 72, height: 72, background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 30, fontWeight: 800, flexShrink: 0,
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>
              {user.name || 'Guest User'}
            </h2>
            <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 0 }}>
              {user.email || 'guest@meditrack.com'}
            </p>
            {user.phone && (
              <p style={{ opacity: 0.75, fontSize: 13, marginTop: 2 }}>
                📱 {user.phone}
              </p>
            )}
            {isGuest && (
              <span style={{
                background: 'rgba(255,255,255,0.2)', padding: '3px 12px',
                borderRadius: 20, fontSize: 12, fontWeight: 600,
                marginTop: 8, display: 'inline-block',
              }}>
                Guest Mode
              </span>
            )}
          </div>
          {!isGuest && (
            <button onClick={() => setEditing(!editing)} style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8, padding: '8px 14px', color: 'white',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            }}>
              <Edit2 size={14} />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        {/* ── EDIT FORM ── */}
        {editing && (
          <div style={{
            background: 'white', borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: 24, overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                Edit Profile
              </h3>
            </div>
            <form onSubmit={handleSaveProfile} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text" value={editForm.name} required
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Phone Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(for SMS reminders)</span>
                </label>
                <input
                  type="tel" placeholder="+91XXXXXXXXXX" value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{
                borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 8, marginBottom: 16,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                  Change Password <span style={{ color: '#9ca3af', fontWeight: 400 }}>(leave blank to keep current)</span>
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                    Current Password
                  </label>
                  <input
                    type="password" placeholder="Enter current password" value={editForm.currentPassword}
                    onChange={e => setEditForm({ ...editForm, currentPassword: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0d9488'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type="password" placeholder="Min. 6 characters" value={editForm.newPassword}
                    onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0d9488'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saveLoading} style={{
                  flex: 1, height: 42, background: '#0d9488', color: 'white',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif',
                }}>
                  <Check size={16} />
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={{
                  height: 42, padding: '0 20px', background: '#f3f4f6',
                  color: '#374151', border: '1px solid #e5e7eb',
                  borderRadius: 8, fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: 6, fontFamily: 'Inter, sans-serif',
                }}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info Card */}
        {!editing && (
          <div style={{
            background: 'white', borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: 24, overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                Account Information
              </h3>
            </div>
            {fields.map((field, i) => (
              <div key={i} style={{
                padding: '16px 24px',
                borderBottom: i < fields.length - 1 ? '1px solid #f3f4f6' : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>{field.label}</span>
                <span style={{
                  fontSize: 14, color: field.value === 'Not set' ? '#9ca3af' : '#111827',
                  fontWeight: 600, fontStyle: field.value === 'Not set' ? 'italic' : 'normal',
                }}>{field.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Guest Notice */}
        {isGuest && (
          <div style={{
            background: '#fefce8', border: '1px solid #fde68a',
            borderRadius: 10, padding: '16px 20px', marginBottom: 24,
          }}>
            <p style={{ fontSize: 14, color: '#92400e', margin: 0, fontWeight: 500 }}>
              You are in Guest Mode. Your data is stored locally only.
              Create an account to save permanently and get SMS reminders.
            </p>
            <button onClick={() => navigate('/register')} style={{
              marginTop: 12, background: '#0d9488', color: 'white',
              border: 'none', borderRadius: 8, padding: '8px 20px',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              Create Free Account
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {!isGuest && (
            <button onClick={handleEnablePush} disabled={pushLoading || isSubscribed} style={{
              width: '100%', padding: '16px 24px',
              background: 'none', border: 'none',
              borderBottom: '1px solid #f3f4f6',
              textAlign: 'left', cursor: isSubscribed ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 600,
              color: isSubscribed ? '#16a34a' : '#0d9488',
              opacity: pushLoading ? 0.6 : 1,
              fontFamily: 'Inter, sans-serif',
            }}>
              {pushLoading ? 'Enabling...' : isSubscribed ? '✅ Push Notifications Enabled' : '🔔 Enable Push Notifications'}
            </button>
          )}
          <button onClick={() => navigate('/dashboard')} style={{
            width: '100%', padding: '16px 24px',
            background: 'none', border: 'none',
            borderBottom: '1px solid #f3f4f6',
            textAlign: 'left', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: '#0d9488',
            fontFamily: 'Inter, sans-serif',
          }}>
            Go to Dashboard
          </button>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '16px 24px',
            background: 'none', border: 'none',
            textAlign: 'left', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: '#dc2626',
            fontFamily: 'Inter, sans-serif',
          }}>
            Sign Out
          </button>
        </div>

      </div>
      <ToastContainer />
    </>
  )
}

export default Profile
