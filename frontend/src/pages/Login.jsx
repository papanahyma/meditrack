import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/authService'
import { toast, ToastContainer } from 'react-toastify'
import { Eye, EyeOff, Mail, Heart, ArrowRight } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser(form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      toast.success('Welcome back!')
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    localStorage.setItem('user', JSON.stringify({
      _id: 'guest', name: 'Guest User',
      email: 'guest@meditrack.com', isGuest: true,
    }))
    navigate('/dashboard')
  }

  const inputStyle = {
    width: '100%', height: 50,
    border: '1.5px solid #E2E8F0', borderRadius: 12,
    padding: '0 16px', fontSize: 15, outline: 'none',
    background: '#F8FAFC', color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const btnPrimary = {
    width: '100%', height: 50,
    background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
    color: 'white', border: 'none', borderRadius: 12,
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 15px rgba(13,148,136,0.3)',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'Inter, sans-serif', background: '#F8FAFC',
    }}>

      {/* Left Panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, #0D9488 0%, #14B8A6 50%, #2DD4BF 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 60, color: 'white', position: 'relative', overflow: 'hidden',
      }} className="d-none d-lg-flex">
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', top: -80, right: -80,
        }} />
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', bottom: 40, left: -60,
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380, textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, background: 'rgba(255,255,255,0.2)',
            borderRadius: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 28px',
          }}>
            <Heart size={36} color="white" fill="white" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.5px' }}>
            MediTrack
          </h1>
          <p style={{ opacity: 0.85, fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Your personal health companion. Manage medications, track adherence, and never miss a dose.
          </p>
          {['Smart email & SMS reminders', 'Adherence analytics', 'Inventory tracking', 'Caregiver sharing'].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, textAlign: 'left' }}>
              <div style={{
                width: 24, height: 24, background: 'rgba(255,255,255,0.25)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{ fontSize: 14, opacity: 0.9 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 24px', background: '#F8FAFC',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo */}
          <div className="d-lg-none" style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
              borderRadius: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 12px',
            }}>
              <Heart size={24} color="white" fill="white" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>MediTrack</h2>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
            Welcome back
          </h2>
          <p style={{ color: '#64748B', fontSize: 15, marginBottom: 32 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#14B8A6'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  placeholder="Enter your password"
                  value={form.password} onChange={handleChange} required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = '#14B8A6'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0,
                }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ ...btnPrimary, marginTop: 24, marginBottom: 0 }}>
              {loading ? 'Signing in...' : <> Sign In <ArrowRight size={16} /></>}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ color: '#94A3B8', fontSize: 13 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>

            <button type="button" onClick={handleGuest} style={{
              width: '100%', height: 50, background: '#F1F5F9', color: '#374151',
              border: '1.5px solid #E2E8F0', borderRadius: 12,
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>
              Continue as Guest
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </div>
  )
}

export default Login
