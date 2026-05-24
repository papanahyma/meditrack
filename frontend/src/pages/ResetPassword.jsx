import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import { Eye, EyeOff, Lock } from 'lucide-react'
import API from '../services/api'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await API.post(`/api/auth/reset-password/${token}`, { password })
      toast.success('Password reset successful!')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed or link expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
      fontFamily: "'Inter','Segoe UI',sans-serif"
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-card)',
        borderRadius: 16, padding: '40px 36px',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>

        <div style={{
          width: 56, height: 56, background: '#f0fdfa',
          borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <Lock size={24} color="#0d9488" />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          Reset Password
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ height: 46, borderRadius: 8, fontSize: 15, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', color: '#9ca3af', cursor: 'pointer',
              }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Confirm Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{ height: 46, borderRadius: 8, fontSize: 15 }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 48,
              background: 'linear-gradient(135deg, #0f766e, #0d9488)',
              color: 'white', border: 'none',
              borderRadius: 8, fontWeight: 700,
              fontSize: 15, cursor: 'pointer',
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  )
}

export default ResetPassword