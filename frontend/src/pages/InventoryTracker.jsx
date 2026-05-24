import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import Navbar from '../components/NavBar'
import API from '../services/api'

const InventoryTracker = () => {
  const navigate = useNavigate()
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [restockValues, setRestockValues] = useState({})

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
  useEffect(() => {
    fetchMedications()
  }, [])

  const updateInventory = async (id, newInventory) => {
    if (newInventory < 0) return
    setUpdatingId(id)
    try {
      await API.put(`/medications/${id}`, { inventory: newInventory })
      toast.success('Inventory updated')
      fetchMedications()
    } catch (err) {
      toast.error('Failed to update inventory')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRestock = async (med) => {
    const amount = parseInt(restockValues[med._id] || 0)
    if (!amount || amount <= 0) {
      toast.warning('Enter a valid restock amount')
      return
    }
    await updateInventory(med._id, med.inventory + amount)
    setRestockValues({ ...restockValues, [med._id]: '' })
  }

  const getStockStatus = (inventory) => {
    if (inventory === 0) return { label: 'Out of Stock', color: '#dc2626', bg: '#fee2e2' }
    if (inventory <= 5) return { label: 'Critical', color: '#dc2626', bg: '#fee2e2' }
    if (inventory <= 10) return { label: 'Low Stock', color: '#d97706', bg: '#fef3c7' }
    return { label: 'In Stock', color: '#16a34a', bg: '#dcfce7' }
  }

  const outOfStock = medications.filter(m => m.inventory === 0).length
  const critical = medications.filter(m => m.inventory > 0 && m.inventory <= 5).length
  const lowStock = medications.filter(m => m.inventory > 5 && m.inventory <= 10).length
  const inStock = medications.filter(m => m.inventory > 10).length

  if (loading) return (
    <>
      <Navbar />
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border" style={{ color: '#0d9488' }} role="status" />
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Inventory Tracker
          </h2>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            Monitor your medication stock levels and restock when running low.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          {[
            { label: 'In Stock', value: inStock, color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
            { label: 'Low Stock', value: lowStock, color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
            { label: 'Critical', value: critical, color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
            { label: 'Out of Stock', value: outOfStock, color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca' },
          ].map((card, i) => (
            <div className="col-6 col-md-3 mb-3" key={i}>
              <div style={{
                background: card.bg, border: `1px solid ${card.border}`,
                borderRadius: 12, padding: '20px 20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: card.color }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 13, color: card.color, fontWeight: 600, marginTop: 4 }}>
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Inventory Table */}
        <div style={{
          background: 'white', borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              All Medications
            </h3>
            <button
              onClick={() => navigate('/add-medication')}
              style={{
                background: '#0d9488', color: 'white',
                border: 'none', borderRadius: 8,
                padding: '8px 18px', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              Add Medication
            </button>
          </div>

          {medications.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <p style={{ fontSize: 15 }}>No medications found.</p>
              <button
                onClick={() => navigate('/add-medication')}
                style={{
                  background: '#0d9488', color: 'white',
                  border: 'none', borderRadius: 8,
                  padding: '10px 24px', fontWeight: 600,
                  cursor: 'pointer', marginTop: 8,
                }}
              >
                Add your first medication
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Medication', 'Form', 'Stock Level', 'Status', 'Adjust Stock', 'Restock'].map(h => (
                      <th key={h} style={{
                        padding: '12px 20px', textAlign: 'left',
                        fontSize: 12, fontWeight: 600,
                        color: '#6b7280', textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #e5e7eb',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med, i) => {
                    const status = getStockStatus(med.inventory)
                    return (
                      <tr key={med._id} style={{
                        borderBottom: i < medications.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        {/* Medicine */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
                            {med.medicineName}
                          </div>
                          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                            {med.dosage}
                          </div>
                        </td>

                        {/* Form */}
                        <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: 14 }}>
                          {med.form}
                        </td>

                        {/* Stock Level Bar */}
                        <td style={{ padding: '16px 20px', minWidth: 160 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                            {med.inventory} doses left
                          </div>
                          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min((med.inventory / 30) * 100, 100)}%`,
                              background: med.inventory === 0 ? '#dc2626' :
                                          med.inventory <= 5 ? '#dc2626' :
                                          med.inventory <= 10 ? '#d97706' : '#0d9488',
                              borderRadius: 4,
                              transition: 'width 0.3s',
                            }} />
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            background: status.bg, color: status.color,
                            padding: '4px 12px', borderRadius: 20,
                            fontSize: 12, fontWeight: 600,
                          }}>
                            {status.label}
                          </span>
                        </td>

                        {/* Adjust Stock +/- */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => updateInventory(med._id, med.inventory - 1)}
                              disabled={med.inventory === 0 || updatingId === med._id}
                              style={{
                                width: 32, height: 32,
                                background: '#f3f4f6', border: '1px solid #e5e7eb',
                                borderRadius: 6, cursor: 'pointer',
                                fontWeight: 700, fontSize: 16,
                                color: '#374151',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              −
                            </button>
                            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 28, textAlign: 'center' }}>
                              {med.inventory}
                            </span>
                            <button
                              onClick={() => updateInventory(med._id, med.inventory + 1)}
                              disabled={updatingId === med._id}
                              style={{
                                width: 32, height: 32,
                                background: '#f3f4f6', border: '1px solid #e5e7eb',
                                borderRadius: 6, cursor: 'pointer',
                                fontWeight: 700, fontSize: 16,
                                color: '#374151',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Restock */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={restockValues[med._id] || ''}
                              onChange={(e) => setRestockValues({
                                ...restockValues,
                                [med._id]: e.target.value
                              })}
                              style={{
                                width: 70, height: 34,
                                border: '1px solid #e5e7eb',
                                borderRadius: 6, padding: '0 10px',
                                fontSize: 14, outline: 'none',
                              }}
                            />
                            <button
                              onClick={() => handleRestock(med)}
                              disabled={updatingId === med._id}
                              style={{
                                height: 34, padding: '0 14px',
                                background: '#0d9488', color: 'white',
                                border: 'none', borderRadius: 6,
                                fontWeight: 600, fontSize: 13,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                              }}
                            >
                              Restock
                            </button>
                          </div>
                        </td>

                      </tr>
                    )
                  })}
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

export default InventoryTracker