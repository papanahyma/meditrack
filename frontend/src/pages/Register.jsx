import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../services/api'
import { toast, ToastContainer } from 'react-toastify'
import { Eye, EyeOff, Heart, ArrowRight, Mail } from 'lucide-react'

const Register = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = fill form, 2 = verify OTP
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Step 1: send OTP to email before creating account
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setOtpLoading(true)
    try {
      // Use a separate endpoint to send registration OTP (email must not exist yet)
      await API.post('/auth/send-register-otp', { email: form.email })
      toast.success('OTP sent to your email!')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // Step 2: verify OTP then create account
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await API.post('/auth/register', { ...form, otp })
      localStorage.setItem('user', JSON.stringify(res.data))
      localStorage.setItem('token', res.data.token)
      toast.success('Account created successfully!')
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 46,
    border: '1.5px solid #E2E8F0', borderRadius: 8,
    padding: '0 14px', fontSize: 15, outline: 'none',
    background: '#F8FAFC', color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const btnPrimary = {
    width: '100%', height: 48,
    background: 'linear-gradient(135deg, #0f766e, #0d9488)',
    color: 'white', border: 'none', borderRadius: 8,
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f9fafb',
      display: 'flex', fontFamily: 'Inter, sans-serif'
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
          <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12 }}>Join MediTrack</h2>
          <p style={{ opacity: 0.85, fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Create your free account and start managing your medications professionally.
          </p>
          {[
            'Free forever — no credit card needed',
            'SMS + email reminders at medicine time',
            'Track adherence with analytics',
            'Inventory & low stock alerts',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, textAlign: 'left' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{ fontSize: 14, opacity: 0.9 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 24px',
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

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              {step === 1 ? 'Create your account' : 'Verify your email'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: 15 }}>
              {step === 1 ? (
                <>Already have an account?{' '}
                  <Link to="/login" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                </>
              ) : (
                <>We sent a 6-digit code to <strong>{form.email}</strong></>
              )}
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s <= step ? '#0d9488' : '#e5e7eb',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* ── STEP 1: FILL FORM ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text" name="name" placeholder="John Doe"
                  value={form.name} onChange={handleChange} required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  type="email" name="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Phone Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(for SMS reminders)</span>
                </label>
                <input
                  type="tel" name="phone" placeholder="+91XXXXXXXXXX"
                  value={form.phone} onChange={handleChange}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Include country code e.g. +91 for India
                </p>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} name="password"
                    placeholder="Min. 6 characters"
                    value={form.password} onChange={handleChange} required
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => e.target.style.borderColor = '#0d9488'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0,
                  }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={otpLoading} style={btnPrimary}>
                {otpLoading ? 'Sending OTP...' : <><Mail size={16} /> Send Verification Code <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* ── STEP 2: VERIFY OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister}>
              <div style={{
                background: '#f0fdfa', border: '1px solid #99f6e4',
                borderRadius: 10, padding: '14px 18px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Mail size={18} color="#0d9488" />
                <p style={{ fontSize: 13, color: '#0f766e', margin: 0 }}>
                  OTP sent to <strong>{form.email}</strong>. Check your inbox.
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Enter 6-digit OTP
                </label>
                <input
                  type="text" placeholder="• • • • • •"
                  value={otp} onChange={e => setOtp(e.target.value)}
                  maxLength={6} required
                  style={{
                    ...inputStyle,
                    fontSize: 28, fontWeight: 700,
                    letterSpacing: 14, textAlign: 'center', height: 64,
                  }}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                  Code expires in 5 minutes.
                </p>
              </div>

              <button type="submit" disabled={loading} style={{ ...btnPrimary, marginBottom: 12 }}>
                {loading ? 'Creating account...' : 'Verify & Create Account'}
              </button>

              <button type="button" onClick={() => setStep(1)} style={{
                width: '100%', height: 40, background: 'transparent',
                color: '#9ca3af', border: 'none', fontSize: 13,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
                ← Back & change details
              </button>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button type="button" onClick={handleSendOtp} disabled={otpLoading} style={{
                  background: 'none', border: 'none', color: '#0d9488',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  {otpLoading ? 'Resending...' : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <ToastContainer position="top-right" />
    </div>
  )
}

export default Register
