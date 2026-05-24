import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import { Pill, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Package } from 'lucide-react'
import Navbar from '../components/NavBar'
import API from '../services/api'

const MedicationList = () => {
  const navigate = useNavigate()
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [missedModal, setMissedModal] = useState(null)
  const [missedReason, setMissedReason] = useState('')

  const reasons = [
    'Forgot to take it',
    'Ran out of medication',
    'Side effects',
    'Felt better',
    'Was not available',
    'Other',
  ]

  const fetchMedications = async () => {
  try {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.isGuest) {
    setLoading(false)
    return
  }

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
  
  useEffect(() => {
    fetchMedications()
  }, [])

  const deleteMedication = async (id) => {
    if (!window.confirm('Delete this medication?')) return
    try {
      await API.delete(`/medications/${id}`)
      toast.success('Deleted successfully')
      fetchMedications()
    } catch { toast.error('Delete failed') }
  }

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/medications/${id}`, { status })
      toast.success(`Marked as ${status}`)
      fetchMedications()
    } catch { toast.error('Update failed') }
  }

  const confirmMissed = async () => {
    if (!missedReason) { toast.warning('Please select a reason'); return }
    try {
      await API.put(`/medications/${missedModal}`, { status: 'Missed', missedReason })
      toast.success('Marked as Missed')
      setMissedModal(null)
      setMissedReason('')
      fetchMedications()
    } catch { toast.error('Failed to update') }
  }

  const getFormColor = (form) => {
    const map = {
      'Tablet':    { bg: '#EEF2FF', color: '#6366F1' },
      'Capsule':   { bg: '#FFF1F2', color: '#F43F5E' },
      'Syrup':     { bg: '#ECFDF5', color: '#10B981' },
      'Injection': { bg: '#FFFBEB', color: '#F59E0B' },
      'Drops':     { bg: '#F0FDFA', color: '#0D9488' },
      'Cream':     { bg: '#FDF4FF', color: '#A855F7' },
    }
    return map[form] || { bg: '#F8FAFC', color: '#64748B' }
  }

  if (loading) return (
    <>
      <Navbar />
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '70vh',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border" style={{ color: '#14B8A6', width: 36, height: 36 }} />
          <p style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>
            Loading medications...
          </p>
        </div>
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Pill size={32} color="#0D9488" />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
          Medications unavailable in Guest Mode
        </h3>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>
          Create an account to add and manage your medications.
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
            color: 'white', border: 'none', borderRadius: 12,
            padding: '12px 28px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Create Free Account
        </button>
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
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 28,
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h2 style={{
              fontSize: 26, fontWeight: 800,
              color: '#0F172A', margin: '0 0 4px',
            }}>
              My Medications
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
              {medications.length} medication{medications.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <button
            onClick={() => navigate('/add-medication')}
            style={{
              background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '11px 22px', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Plus size={16} /> Add Medication
          </button>
        </div>

        {/* Empty State */}
        {medications.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 20,
            border: '1px solid #E2E8F0',
            padding: '80px 24px', textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, background: '#F0FDFA',
              borderRadius: 24, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Pill size={36} color="#0D9488" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              No medications yet
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>
              Add your first medication to start tracking.
            </p>
            <button
              onClick={() => navigate('/add-medication')}
              style={{
                background: 'linear-gradient(135deg, #0D9488, #14B8A6)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '13px 32px', fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(13,148,136,0.3)',
              }}
            >
              Add First Medication
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {medications.map((med) => {
              const formStyle = getFormColor(med.form)
              return (
                <div key={med._id} style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16, padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                  }}
                >

                  {/* Card Header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 14,
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: 16, fontWeight: 700,
                        color: '#0F172A', margin: '0 0 6px',
                      }}>
                        {med.medicineName}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: formStyle.bg, color: formStyle.color,
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                        }}>
                          {med.form}
                        </span>
                        <span style={{ fontSize: 13, color: '#64748B' }}>
                          {med.dosage}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      flexShrink: 0, marginLeft: 8,
                      background: med.status === 'Taken' ? '#ECFDF5' :
                                  med.status === 'Missed' ? '#FFF1F2' : '#FFFBEB',
                      color: med.status === 'Taken' ? '#10B981' :
                             med.status === 'Missed' ? '#F43F5E' : '#F59E0B',
                    }}>
                      {med.status}
                    </span>
                  </div>

                  {/* Info Pills */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {med.reminderTime && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: '#F0FDFA', border: '1px solid #99F6E4',
                        borderRadius: 8, padding: '5px 10px',
                        fontSize: 12, color: '#0D9488', fontWeight: 500,
                      }}>
                        <Clock size={12} /> {med.reminderTime}
                      </div>
                    )}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: med.inventory <= 5 ? '#FFF1F2' : '#F8FAFC',
                      border: `1px solid ${med.inventory <= 5 ? '#FECDD3' : '#E2E8F0'}`,
                      borderRadius: 8, padding: '5px 10px',
                      fontSize: 12,
                      color: med.inventory <= 5 ? '#F43F5E' : '#64748B',
                      fontWeight: 500,
                    }}>
                      <Package size={12} /> {med.inventory} left
                    </div>
                  </div>

                  {/* Instructions */}
                  {med.instructions && (
                    <p style={{
                      fontSize: 12, color: '#64748B',
                      margin: '0 0 14px', lineHeight: 1.5,
                      background: '#F8FAFC', borderRadius: 8,
                      padding: '8px 10px',
                    }}>
                      {med.instructions}
                    </p>
                  )}

                  {/* Status Buttons */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <button
                      onClick={() => updateStatus(med._id, 'Taken')}
                      disabled={med.status === 'Taken'}
                      style={{
                        flex: 1, height: 36,
                        background: med.status === 'Taken' ? '#10B981' : '#ECFDF5',
                        color: med.status === 'Taken' ? 'white' : '#10B981',
                        border: `1px solid ${med.status === 'Taken' ? '#10B981' : '#A7F3D0'}`,
                        borderRadius: 8, fontWeight: 600, fontSize: 12,
                        cursor: med.status === 'Taken' ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 4,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <CheckCircle size={13} /> Taken
                    </button>

                    <button
                      onClick={() => { setMissedModal(med._id); setMissedReason('') }}
                      disabled={med.status === 'Missed'}
                      style={{
                        flex: 1, height: 36,
                        background: med.status === 'Missed' ? '#F43F5E' : '#FFF1F2',
                        color: med.status === 'Missed' ? 'white' : '#F43F5E',
                        border: `1px solid ${med.status === 'Missed' ? '#F43F5E' : '#FECDD3'}`,
                        borderRadius: 8, fontWeight: 600, fontSize: 12,
                        cursor: med.status === 'Missed' ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 4,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <XCircle size={13} /> Missed
                    </button>

                    <button
                      onClick={() => updateStatus(med._id, 'Pending')}
                      disabled={med.status === 'Pending'}
                      style={{
                        flex: 1, height: 36,
                        background: med.status === 'Pending' ? '#F59E0B' : '#FFFBEB',
                        color: med.status === 'Pending' ? 'white' : '#F59E0B',
                        border: `1px solid ${med.status === 'Pending' ? '#F59E0B' : '#FDE68A'}`,
                        borderRadius: 8, fontWeight: 600, fontSize: 12,
                        cursor: med.status === 'Pending' ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 4,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <Clock size={13} /> Pending
                    </button>
                  </div>

                  {/* Edit / Delete */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => navigate(`/edit-medication/${med._id}`)}
                      style={{
                        flex: 1, height: 36,
                        background: '#F8FAFC', color: '#64748B',
                        border: '1px solid #E2E8F0', borderRadius: 8,
                        fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 4,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => deleteMedication(med._id)}
                      style={{
                        flex: 1, height: 36,
                        background: '#FFF1F2', color: '#F43F5E',
                        border: '1px solid #FECDD3', borderRadius: 8,
                        fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 4,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Missed Modal */}
      {missedModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000, padding: 24,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: '28px', width: '100%', maxWidth: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
              Why was this dose missed?
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
              This helps track your medication history accurately.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setMissedReason(r)}
                  style={{
                    padding: '12px 16px', borderRadius: 10,
                    border: `2px solid ${missedReason === r ? '#0D9488' : '#E2E8F0'}`,
                    background: missedReason === r ? '#F0FDFA' : 'white',
                    color: missedReason === r ? '#0D9488' : '#0F172A',
                    fontWeight: missedReason === r ? 600 : 400,
                    cursor: 'pointer', textAlign: 'left', fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmMissed}
                style={{
                  flex: 1, height: 46,
                  background: '#F43F5E', color: 'white',
                  border: 'none', borderRadius: 10,
                  fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Confirm Missed
              </button>
              <button
                onClick={() => { setMissedModal(null); setMissedReason('') }}
                style={{
                  flex: 1, height: 46,
                  background: '#F8FAFC', color: '#64748B',
                  border: '1px solid #E2E8F0', borderRadius: 10,
                  fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" />
    </>
  )
}

export default MedicationList