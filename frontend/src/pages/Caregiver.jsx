import React, { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import Navbar from '../components/NavBar'
import API from '../services/api'

const Caregiver = () => {
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [caregiverEmail, setCaregiverEmail] = useState(
    localStorage.getItem('caregiverEmail') || ''
  )
  const [inputEmail, setInputEmail] = useState('')
  const [sending, setSending] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchMedications = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))

    const res = await API.get(`/medications?userId=${user._id}`)

    console.log("FULL RESPONSE:", res.data)

    setMedications(
      Array.isArray(res.data.medications)
        ? res.data.medications
        : []
    )

  } catch (error) {
    console.log(error)
    toast.error('Failed to load medications')
    setMedications([]) // safety fallback
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { fetchMedications() }, [])

  const saveCaregiver = () => {
    if (!inputEmail || !inputEmail.includes('@')) {
      toast.error('Enter a valid email address')
      return
    }
    localStorage.setItem('caregiverEmail', inputEmail)
    setCaregiverEmail(inputEmail)
    setInputEmail('')
    toast.success('Caregiver email saved')
  }

  const removeCaregiver = () => {
    localStorage.removeItem('caregiverEmail')
    setCaregiverEmail('')
    toast.success('Caregiver removed')
  }

  const sendReport = async () => {
    if (!caregiverEmail) {
      toast.warning('Please add a caregiver email first')
      return
    }
    setSending(true)
    try {
      const taken = medications.filter(m => m.status === 'Taken').length
      const missed = medications.filter(m => m.status === 'Missed').length
      const pending = medications.filter(m => m.status === 'Pending').length
      const adherence = medications.length > 0
        ? Math.round((taken / medications.length) * 100) : 0

      await API.post('/medications/remind', {
        medicineName: 'Caregiver Report',
        dosage: `Taken: ${taken} | Missed: ${missed} | Pending: ${pending} | Adherence: ${adherence}%`,
        form: 'Report',
        reminderTime: new Date().toLocaleTimeString(),
        userEmail: caregiverEmail,
      })

      toast.success(`Report sent to ${caregiverEmail}`)
    } catch {
      toast.error('Failed to send report')
    } finally {
      setSending(false)
    }
  }

  const taken = medications.filter(m => m.status === 'Taken').length
  const missed = medications.filter(m => m.status === 'Missed').length
  const pending = medications.filter(m => m.status === 'Pending').length
  const adherence = medications.length > 0
    ? Math.round((taken / medications.length) * 100) : 0

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Caregiver Access
          </h2>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            Share your medication status with a trusted caregiver or family member.
          </p>
        </div>

        {/* Caregiver Email Setup */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: '1px solid #e5e7eb', marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              Caregiver Email
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            {caregiverEmail ? (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#f0fdfa', border: '1px solid #ccfbf1',
                  borderRadius: 8, padding: '14px 18px', marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#0f766e', fontWeight: 500, marginBottom: 2 }}>
                      Active Caregiver
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {caregiverEmail}
                    </div>
                  </div>
                  <button
                    onClick={removeCaregiver}
                    style={{
                      background: '#fee2e2', color: '#dc2626',
                      border: 'none', borderRadius: 6,
                      padding: '6px 14px', fontWeight: 600,
                      fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
                <button
                  onClick={sendReport}
                  disabled={sending}
                  style={{
                    background: '#0d9488', color: 'white',
                    border: 'none', borderRadius: 8,
                    padding: '10px 24px', fontWeight: 600,
                    fontSize: 14, cursor: 'pointer',
                  }}
                >
                  {sending ? 'Sending...' : 'Send Medication Report Now'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                  Add a caregiver email to share your medication adherence reports.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="caregiver@example.com"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    style={{ height: 44, borderRadius: 8, fontSize: 14 }}
                  />
                  <button
                    onClick={saveCaregiver}
                    style={{
                      background: '#0d9488', color: 'white',
                      border: 'none', borderRadius: 8,
                      padding: '0 20px', fontWeight: 600,
                      fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Save Caregiver
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary for Caregiver */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: '1px solid #e5e7eb', marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              Current Medication Summary
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="row">
              {[
                { label: 'Total Medications', value: medications.length, color: '#0d9488' },
                { label: 'Taken', value: taken, color: '#16a34a' },
                { label: 'Missed', value: missed, color: '#dc2626' },
                { label: 'Pending', value: pending, color: '#d97706' },
              ].map((s, i) => (
                <div className="col-6 col-md-3 mb-3" key={i}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Adherence Bar */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Adherence Rate
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0d9488' }}>
                  {adherence}%
                </span>
              </div>
              <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${adherence}%`,
                  background: adherence >= 75 ? '#0d9488' : adherence >= 50 ? '#d97706' : '#dc2626',
                  borderRadius: 6, transition: 'width 0.3s',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Medication List for Caregiver */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              Medication Details
            </h3>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner-border" style={{ color: '#0d9488' }} />
            </div>
          ) : medications.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              No medications found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Medicine', 'Dosage', 'Form', 'Reminder Time', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '12px 20px', textAlign: 'left',
                        fontSize: 12, fontWeight: 600, color: '#6b7280',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        borderBottom: '1px solid #e5e7eb',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med, i) => (
                    <tr key={med._id} style={{
                      borderBottom: i < medications.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#111827' }}>
                        {med.medicineName}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 14 }}>
                        {med.dosage}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 14 }}>
                        {med.form}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 14 }}>
                        {med.reminderTime || '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                          background: med.status === 'Taken' ? '#dcfce7' :
                                      med.status === 'Missed' ? '#fee2e2' : '#fef3c7',
                          color: med.status === 'Taken' ? '#16a34a' :
                                 med.status === 'Missed' ? '#dc2626' : '#d97706',
                        }}>
                          {med.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <ToastContainer />
    </>
  )
}

export default Caregiver