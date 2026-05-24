import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import { Mail, ArrowLeft } from 'lucide-react'
import API from '../services/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await API.post('/api/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent! Check your email.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link')
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

        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#0d9488', textDecoration: 'none',
          fontSize: 14, fontWeight: 600, marginBottom: 28,
        }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, background: '#f0fdfa',
              borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Mail size={28} color="#0d9488" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              Check your email
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
              We sent a password reset link to <strong>{email}</strong>.
              It expires in 15 minutes.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Forgot Password
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  )
}

export default ForgotPassword