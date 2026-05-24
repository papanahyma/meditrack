import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import Navbar from '../components/NavBar'
import API from '../services/api'
import axios from 'axios'
import { Plus, Clock, Pill, FileText, Package, Calendar, Image, Repeat, AlertCircle } from 'lucide-react'
import debounce from "lodash.debounce";

const API_URL = import.meta.env.VITE_API_URL;

const SCHEDULE_TYPES = [
  { value: 'once', label: 'Single time daily', desc: 'e.g. 8:00 AM once a day' },
  { value: 'multiple', label: 'Multiple times daily', desc: 'e.g. 8 AM, 2 PM, 8 PM' },
  { value: 'interval', label: 'Every X hours', desc: 'e.g. every 8 hours starting 8 AM' },
  { value: 'alternate', label: 'Alternate days', desc: 'e.g. every other day at 8 AM' },
]

const SEVERITY_COLORS = {
  mild: { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
  moderate: { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
  severe: { bg: '#fff1f2', color: '#ef4444', border: '#fecdd3' },
}

const inputStyle = {
  width: '100%', height: 44,
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  padding: '0 12px', fontSize: 14, outline: 'none',
  background: 'var(--bg-card)', color: 'var(--text-primary)',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  display: 'block', fontSize: 13,
  fontWeight: 600, color: 'var(--text-primary)',
  marginBottom: 6,
}

const sectionStyle = {
  background: 'var(--bg-card)', borderRadius: 12,
  border: '1px solid var(--border)', padding: '20px 24px',
  marginBottom: 16,
}

const AddMedication = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    medicineName: '', dosage: '', form: '',
    instructions: '', inventory: '',
    prescriptionImage: '', refillDate: '',
    lowStockThreshold: 5,
  })

  // ── Single time ───────────────────────────────────────────────
  const [reminderHour, setReminderHour] = useState('')
  const [reminderMinute, setReminderMinute] = useState('')
  const [reminderAmPm, setReminderAmPm] = useState('AM')

  // ── Schedule type ─────────────────────────────────────────────
  const [scheduleType, setScheduleType] = useState('once')

  // ── Multiple times ────────────────────────────────────────────
  const [multipleTimes, setMultipleTimes] = useState([''])

  // ── Interval ──────────────────────────────────────────────────
  const [intervalHours, setIntervalHours] = useState(8)
  const [startHour, setStartHour] = useState('')
  const [startMinute, setStartMinute] = useState('00')
  const [startAmPm, setStartAmPm] = useState('AM')

  // ── Side effects ──────────────────────────────────────────────
  const [sideEffects, setSideEffects] = useState([])
  const [newEffect, setNewEffect] = useState({ note: '', severity: 'mild' })

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  // ── Drug name suggestions (for future autocomplete) ─────────────────
  const [suggestions, setSuggestions] = useState([]);

  const [detectedMeds, setDetectedMeds] = useState([])

  // ── OCR + Medicine AI results ──────────────────────────────────────────────
  const [medicineAI, setMedicineAI] = useState(null)
  // ── Image upload ──────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const data = new FormData()
    data.append('image', file)
    try {
      setUploading(true)
      const res = await axios.post(`${API_URL}/api/upload/prescription`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFormData(prev => ({ ...prev, prescriptionImage: res.data.imageUrl }))
      toast.success('Prescription uploaded!')
    } catch {
      toast.error('Upload failed')
    }
    setUploading(false)
  }

 // ── OCR scan ──────────────────────────────────────────────                 

const [ocrLoading, setOcrLoading] = useState(false)

const scanPrescription = async () => {
  try {
    setOcrLoading(true)

    const res = await axios.post(
      `${API_URL}/api/ocr/scan`,
      {
        imageUrl: formData.prescriptionImage,
      }
    )

    const extractedText = res.data.extractedText

    console.log("OCR TEXT:", extractedText)

    // =========================
    // CLEAN + SPLIT TEXT
    // =========================

    const lines = extractedText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 2)

    // =========================
    // MULTI MEDICINE DETECTION
    // =========================

    const detectedMedicines = []

    lines.forEach((line) => {

      if (!line || line.length < 3) return

      // Find dosage
      const dosageMatch = line.match(/\b\d+\s?(mg|ml|g)\b/i)

      // Remove dosage from medicine name
      let cleanedName = line

      if (dosageMatch) {
        cleanedName = cleanedName.replace(dosageMatch[0], "").trim()
      }

      const lower = cleanedName.toLowerCase()

      // Ignore useless prescription text
      if (
        lower.includes("take") ||
        lower.includes("days") ||
        lower.includes("morning") ||
        lower.includes("night") ||
        lower.includes("after food") ||
        lower.includes("before food") ||
        lower.includes("doctor") ||
        lower.includes("rx")
      ) {
        return
      }

      // Remove special characters
      cleanedName = cleanedName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()

      if (!cleanedName) return

      detectedMedicines.push({
        name: cleanedName,
        dosage: dosageMatch ? dosageMatch[0] : "",
      })
    })

    console.log("Detected Medicines:", detectedMedicines)

    // =========================
    // SAVE DETECTED MEDICINES
    // =========================

    setDetectedMeds(detectedMedicines)

    // =========================
    // AUTO FILL FIRST MEDICINE
    // =========================

    if (detectedMedicines.length > 0) {

      const firstMed = detectedMedicines[0]

      console.log("AUTO FILLING:", firstMed)

      setFormData((prev) => ({
        ...prev,
        medicineName: firstMed.name || "",
        dosage: firstMed.dosage || "",
      }))

      toast.success("Prescription scanned & form auto-filled!")
    } else {
      toast.warning("No medicines detected")
    }

  } catch (error) {
    console.log(error)
    toast.error("OCR failed")
  } finally {
    setOcrLoading(false)
  }
}

// ── Multiple times helpers ────────────────────────────────────
    const addTimeSlot = () => setMultipleTimes([...multipleTimes, ''])
    const removeTimeSlot = (i) => setMultipleTimes(multipleTimes.filter((_, idx) => idx !== i))
    const updateTimeSlot = (i, val) => {
      const updated = [...multipleTimes]
      updated[i] = val
      setMultipleTimes(updated)
    }

    // ── Side effect helpers ───────────────────────────────────────
    const addSideEffect = () => {
      if (!newEffect.note.trim()) return
      setSideEffects([...sideEffects, { ...newEffect, loggedAt: new Date().toISOString() }])
      setNewEffect({ note: '', severity: 'mild' })
    }
    const removeSideEffect = (i) => setSideEffects(sideEffects.filter((_, idx) => idx !== i))

    // ── Build computed reminder times from interval ───────────────
    const computeIntervalTimes = () => {
      if (!startHour || !intervalHours) return []
      let h = parseInt(startHour)
      const m = parseInt(startMinute) || 0
      if (startAmPm === 'PM' && h !== 12) h += 12
      if (startAmPm === 'AM' && h === 12) h = 0

      const times = []
      let currentMins = h * 60 + m
      while (currentMins < 24 * 60) {
        const hh = Math.floor(currentMins / 60)
        const mm = currentMins % 60
        const ampm = hh >= 12 ? 'PM' : 'AM'
        const h12 = hh % 12 === 0 ? 12 : hh % 12
        times.push(`${h12}:${String(mm).padStart(2, '0')} ${ampm}`)
        currentMins += parseInt(intervalHours) * 60
      }
      return times
    }

  // ── Fetch drug suggestions (for future autocomplete feature) ───────────────────────────────                                      
  const fetchSuggestions = async (value) => {
    try {
      setIsSearching(true)
      if (!value.trim()) {
        setSuggestions([])
        return
      }

      const res = await axios.get(
        `${API_URL}/api/drugs/search?query=${value}`
      )

      setSuggestions(res.data)
    } catch (error) {
      console.log(error)
    }
  }

  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestions, 300),
    []
  )

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('user'))

      let reminderTime = ''
      let reminderTimes = []

      if (scheduleType === 'once' || scheduleType === 'alternate') {
        const mm = String(reminderMinute).padStart(2, '0')
        reminderTime = reminderHour ? `${reminderHour}:${mm} ${reminderAmPm}` : ''
        reminderTimes = reminderTime ? [reminderTime] : []
      } else if (scheduleType === 'multiple') {
        reminderTimes = multipleTimes.filter(t => t.trim())
        reminderTime = reminderTimes[0] || ''
      } else if (scheduleType === 'interval') {
        reminderTimes = computeIntervalTimes()
        reminderTime = reminderTimes[0] || ''
      }

      const medicationData = {
        ...formData,
        userId: user._id,
        reminderTime,
        reminderTimes,
        scheduleType,
        intervalHours: scheduleType === 'interval' ? parseInt(intervalHours) : undefined,
        startTime: scheduleType === 'interval' && startHour
          ? `${startHour}:${String(startMinute).padStart(2, '0')} ${startAmPm}` : undefined,
        alternateDays: scheduleType === 'alternate',
        sideEffects,
      }

      await API.post('/api/medications/add', medicationData)
      toast.success('Medication added successfully! 💊')

      setTimeout(() => navigate('/medications'), 1200)
    } catch (err) {
      console.error(err)
      toast.error('Failed to add medication')
    } finally {
      setLoading(false)
    }
  }

  const intervalPreview = scheduleType === 'interval' ? computeIntervalTimes() : []

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            💊 Add Medication
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Fill in your medication details and schedule</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Basic Info ─────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Pill size={16} color="#0d9488" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Basic Information</span>
            </div>

            <div style={{ marginBottom: 14, position: 'relative' }}>
              <label style={labelStyle}>Medicine Name *</label>

              <input
                type="text"
                name="medicineName"
                style={inputStyle}
                value={formData.medicineName}
                required
                placeholder="e.g. Paracetamol 500mg"
                onChange={(e) => {
                  handleChange(e)
                  debouncedFetchSuggestions(e.target.value)
                }}
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />

              {(suggestions.length > 0 || isSearching || formData.medicineName) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    marginTop: 4,
                    maxHeight: 220,
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  }}
                >
                    <>
                      {isSearching ? (
                        <div
                          style={{
                            padding: '14px',
                            fontSize: 13,
                            color: '#0d9488',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              border: '2px solid #ccfbf1',
                              borderTop: '2px solid #0d9488',
                              borderRadius: '50%',
                              animation: 'spin 0.7s linear infinite',
                            }}
                          />
                          Searching medicines...
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((drug) => (
                          <div
                            key={drug._id}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                medicineName: drug.name
                              })
                              setSuggestions([])
                            }}
                            style={{
                              padding: '12px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              fontSize: 14,
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#f0fdfa'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'white'
                            }}
                          >
                            💊 {drug.name}
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: '14px',
                            fontSize: 13,
                            color: '#9ca3af',
                          }}
                        >
                          No medicines found
                        </div>
                      )}
                    </>                
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Dosage *</label>
                <input type="text" name="dosage" style={inputStyle}
                  value={formData.dosage} onChange={handleChange} required
                  placeholder="e.g. 500mg"
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={labelStyle}>Form *</label>
                <select name="form" style={inputStyle}
                  value={formData.form} onChange={handleChange} required>
                  <option value="">Select form</option>
                  {['Tablet','Capsule','Syrup','Injection','Drops','Cream','Other'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Instructions</label>
              <textarea name="instructions" rows={2}
                style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                value={formData.instructions} onChange={handleChange}
                placeholder="e.g. Take after meals with water"
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* ── Schedule Type ──────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Repeat size={16} color="#0d9488" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Schedule Type</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {SCHEDULE_TYPES.map(st => (
                <div key={st.value}
                  onClick={() => setScheduleType(st.value)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${scheduleType === st.value ? '#0d9488' : '#e5e7eb'}`,
                    background: scheduleType === st.value ? '#f0fdfa' : 'var(--bg-card)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: scheduleType === st.value ? '#0d9488' : 'var(--text-primary)' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{st.desc}</div>
                </div>
              ))}
            </div>

            {/* Single time */}
            {(scheduleType === 'once' || scheduleType === 'alternate') && (
              <div>
                <label style={labelStyle}>
                  {scheduleType === 'alternate' ? 'Time (every other day)' : 'Reminder Time'}
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" placeholder="Hour" min="1" max="12"
                    style={{ ...inputStyle, width: 80 }}
                    value={reminderHour} onChange={e => setReminderHour(e.target.value)}
                  />
                  <span style={{ fontWeight: 700, fontSize: 18 }}>:</span>
                  <input type="number" placeholder="Min" min="0" max="59"
                    style={{ ...inputStyle, width: 80 }}
                    value={reminderMinute} onChange={e => setReminderMinute(e.target.value)}
                  />
                  <select style={{ ...inputStyle, width: 80 }}
                    value={reminderAmPm} onChange={e => setReminderAmPm(e.target.value)}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
                {scheduleType === 'alternate' && (
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    ℹ️ Alarm will fire every other day at this time
                  </p>
                )}
              </div>
            )}

            {/* Multiple times */}
            {scheduleType === 'multiple' && (
              <div>
                <label style={labelStyle}>Times per day</label>
                {multipleTimes.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="time" style={{ ...inputStyle, flex: 1 }}
                      value={t} onChange={e => updateTimeSlot(i, e.target.value)}
                    />
                    {multipleTimes.length > 1 && (
                      <button type="button" onClick={() => removeTimeSlot(i)}
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontWeight: 700 }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addTimeSlot}
                  style={{ background: '#f0fdfa', color: '#0d9488', border: '1px dashed #0d9488', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  + Add time slot
                </button>
              </div>
            )}

            {/* Interval */}
            {scheduleType === 'interval' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Every (hours)</label>
                    <select style={inputStyle} value={intervalHours} onChange={e => setIntervalHours(e.target.value)}>
                      {[4, 6, 8, 12].map(h => <option key={h} value={h}>Every {h} hours</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Starting at</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="number" placeholder="Hr" min="1" max="12"
                        style={{ ...inputStyle, width: 60 }}
                        value={startHour} onChange={e => setStartHour(e.target.value)}
                      />
                      <input type="number" placeholder="Min" min="0" max="59"
                        style={{ ...inputStyle, width: 60 }}
                        value={startMinute} onChange={e => setStartMinute(e.target.value)}
                      />
                      <select style={{ ...inputStyle, width: 68 }}
                        value={startAmPm} onChange={e => setStartAmPm(e.target.value)}>
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {intervalPreview.length > 0 && (
                  <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0d9488', marginBottom: 6 }}>
                      📅 Scheduled times today:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {intervalPreview.map((t, i) => (
                        <span key={i} style={{ background: '#0d9488', color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Inventory & Refill ─────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Package size={16} color="#0d9488" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Inventory & Refill</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Pill count</label>
                <input type="number" name="inventory" min="0" style={inputStyle}
                  value={formData.inventory} onChange={handleChange} placeholder="e.g. 30"
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={labelStyle}>Low stock alert at</label>
                <input type="number" name="lowStockThreshold" min="1" style={inputStyle}
                  value={formData.lowStockThreshold} onChange={handleChange}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={labelStyle}>Refill date</label>
                <input type="date" name="refillDate" style={inputStyle}
                  value={formData.refillDate} onChange={handleChange}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          </div>

          {/* ── Side Effects Logger ────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertCircle size={16} color="#f59e0b" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Side Effects</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>(optional — log known reactions)</span>
            </div>

            {sideEffects.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {sideEffects.map((se, i) => {
                  const sc = SEVERITY_COLORS[se.severity]
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                    }}>
                      <div>
                        <span style={{ fontSize: 13, color: sc.color, fontWeight: 600 }}>{se.note}</span>
                        <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>({se.severity})</span>
                      </div>
                      <button type="button" onClick={() => removeSideEffect(i)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 }}>
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Describe side effect..."
                style={{ ...inputStyle, flex: 1 }}
                value={newEffect.note}
                onChange={e => setNewEffect({ ...newEffect, note: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSideEffect())}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <select style={{ ...inputStyle, width: 110 }}
                value={newEffect.severity}
                onChange={e => setNewEffect({ ...newEffect, severity: e.target.value })}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <button type="button" onClick={addSideEffect}
                style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>
                +
              </button>
            </div>
          </div>

          {/* ── Prescription Upload ────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Image size={16} color="#0d9488" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Prescription Image</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>(optional)</span>
            </div>
            <input type="file" accept="image/*"
              style={{ ...inputStyle, height: 'auto', padding: '10px 12px' }}
              onChange={handleImageUpload}
            />
            {uploading && <p style={{ fontSize: 13, color: '#0d9488', marginTop: 6 }}>⏳ Uploading...</p>}
            {formData.prescriptionImage && (
              <img src={`${API_URL}${formData.prescriptionImage}`}
                alt="Prescription"
                style={{ width: 180, marginTop: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            )}
          </div>

             {/* //ocr button */}
          {formData.prescriptionImage && (
              <button
                type="button"
                onClick={scanPrescription}
                style={{
                  marginTop: 12,
                  background: '#0d9488',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🔍 Scan Prescription with AI
              </button>
            )}


            {/* AI Detected Medicines */}
{/* ── AI Detected Medicines ────────────────────────────── */}
        {detectedMeds.length > 0 && (
          <div
            style={{
              marginTop: 16,
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h4
              style={{
                marginBottom: 12,
                color: '#0d9488',
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              🤖 AI Detected Medicines
            </h4>

            {detectedMeds.map((med, index) => (
              <div
                key={index}
                onClick={() => {
                  console.log("CLICKED:", med)

                  setFormData(prev => ({
                    ...prev,
                    medicineName: med.name || "",
                    dosage: med.dosage || "",
                  }))

                  toast.success(`${med.name} selected & auto-filled`)
                }}
                style={{
                  padding: '12px 14px',
                  background: 'white',
                  borderRadius: 10,
                  marginBottom: 10,
                  cursor: 'pointer',
                  border: '1px solid #ccfbf1',
                  transition: '0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ccfbf1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#134e4a',
                    marginBottom: 4,
                  }}
                >
                  💊 {med.name}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#0f766e',
                  }}
                >
                  Dosage: {med.dosage || "Not detected"}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  Click to auto-fill form
                </div>
              </div>
            ))}
          </div>
        )}

       {/* // Ai detected Medicines */}

  {medicineAI && (
  <div
    style={{
      marginTop: 20,
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 16,
    }}
  >
    <h3 style={{ color: '#0d9488' }}>
      🧠 AI Medicine Analysis
    </h3>

    {medicineAI.medicineInfo && (
      <>
        <p>
          <strong>Used For:</strong>{" "}
          {medicineAI.medicineInfo.uses}
        </p>

        <p>
          <strong>Side Effects:</strong>
        </p>

        <ul>
          {medicineAI.medicineInfo.sideEffects.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        <p>
          <strong>Precautions:</strong>
        </p>

        <ul>
          {medicineAI.medicineInfo.precautions.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </>
    )}

    {medicineAI.interactionWarnings.length > 0 && (
      <div
        style={{
          marginTop: 14,
          background: '#fff7ed',
          border: '1px solid #fdba74',
          padding: 12,
          borderRadius: 10,
        }}
      >
        <h4 style={{ color: '#ea580c' }}>
          ⚠️ Drug Interaction Warnings
        </h4>

        {medicineAI.interactionWarnings.map((w, i) => (
          <p key={i}>• {w}</p>
        ))}
      </div>
    )}
  </div>
)}

          {/* ── Submit ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={loading}
              style={{
                flex: 1, height: 48, background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: 'white', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
              }}>
              {loading ? 'Adding...' : '➕ Add Medication'}
            </button>
            <button type="button" onClick={() => navigate('/medications')}
              style={{
                height: 48, padding: '0 20px',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                border: '1.5px solid var(--border)', borderRadius: 10,
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}>
              Cancel
            </button>
          </div>

        </form>
      </div>
      <ToastContainer position="top-right" />

      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

    </>
  )
}

export default AddMedication
