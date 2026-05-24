import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import Navbar from '../components/NavBar'
import API from '../services/api'

const EditMedication = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: '',
    form: '',
    instructions: '',
    inventory: '',
  })

  const [reminderHour, setReminderHour] = useState('')
  const [reminderMinute, setReminderMinute] = useState('')
  const [reminderAmPm, setReminderAmPm] = useState('AM')

  // Fetch existing medication data and prefill form
  useEffect(() => {
    const fetchMedication = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        const res = await API.get(`/medications?userId=${user._id}`)
        const med = Array.isArray(res.data.medications)
            ? res.data.medications.find((m) => m._id === id)
            : null

        if (!med) {
          toast.error('Medication not found')
          navigate('/medications')
          return
        }

        setFormData({
          medicineName: med.medicineName || '',
          dosage: med.dosage || '',
          form: med.form || '',
          instructions: med.instructions || '',
          inventory: med.inventory || 0,
        })

        // Parse reminderTime "9:30 AM" back into parts
        if (med.reminderTime) {
          const [timePart, ampm] = med.reminderTime.split(' ')
          const [h, m] = timePart.split(':')
          setReminderHour(h)
          setReminderMinute(m)
          setReminderAmPm(ampm || 'AM')
        }

      } catch (error) {
        console.log(error)
        toast.error('Failed to load medication')
      } finally {
        setLoading(false)
      }
    }

    fetchMedication()
  }, [id])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const mm = String(reminderMinute).padStart(2, '0')
      const reminderTime = reminderHour
        ? `${reminderHour}:${mm} ${reminderAmPm}`
        : ''

      await API.put(`/medications/${id}`, {
        ...formData,
        reminderTime
      })

      toast.success('Medication updated successfully! ✅')

      setTimeout(() => navigate('/medications'), 1500)

    } catch (error) {
      console.log(error)
      toast.error('Failed to update medication ❌')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="card p-4 shadow-sm border-0" style={{ maxWidth: 600, margin: 'auto', borderRadius: '12px' }}>

          <div className="mb-4">
            <h2 className="fw-bold">✏️ Edit Medication</h2>
            <p className="text-muted mb-0">Update the details below and save.</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label className="form-label fw-semibold">Medicine Name</label>
              <input
                type="text"
                name="medicineName"
                className="form-control"
                value={formData.medicineName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Dosage</label>
              <input
                type="text"
                name="dosage"
                className="form-control"
                value={formData.dosage}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Form</label>
              <select
                name="form"
                className="form-control"
                value={formData.form}
                onChange={handleChange}
                required
              >
                <option value="">Select form</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Drops">Drops</option>
                <option value="Cream">Cream</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Instructions</label>
              <textarea
                name="instructions"
                className="form-control"
                rows={3}
                placeholder="e.g. Take after meals"
                value={formData.instructions}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Reminder Time</label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="number"
                  placeholder="Hour"
                  min="1"
                  max="12"
                  className="form-control"
                  value={reminderHour}
                  onChange={(e) => setReminderHour(e.target.value)}
                  style={{ width: '90px' }}
                />
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>:</span>
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="59"
                  className="form-control"
                  value={reminderMinute}
                  onChange={(e) => setReminderMinute(e.target.value)}
                  style={{ width: '90px' }}
                />
                <select
                  className="form-control"
                  value={reminderAmPm}
                  onChange={(e) => setReminderAmPm(e.target.value)}
                  style={{ width: '90px' }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Inventory (pills/doses left)</label>
              <input
                type="number"
                name="inventory"
                className="form-control"
                value={formData.inventory}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/medications')}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default EditMedication