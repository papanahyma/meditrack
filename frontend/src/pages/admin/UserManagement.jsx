import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import { toast, ToastContainer } from 'react-toastify'
import { Users, Shield, UserCheck, ArrowLeft, User, Mail } from 'lucide-react'
import Navbar from '../../components/NavBar'

const UserManagement = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get('/admin/users')
        setUsers(res.data)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users')
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const totalUsers = users.length
  const admins = users.filter(u => u.role === 'admin' || u.isAdmin).length
  const guests = users.filter(u => u.isGuest).length
  const regularUsers = totalUsers - admins - guests

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
                padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <ArrowLeft size={18} color="#6b7280" />
            </button>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                User Management
              </h2>
              <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
                Manage all registered users and their roles.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            {[
              { label: 'Total Users', value: totalUsers, color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: Users },
              { label: 'Admins', value: admins, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: Shield },
              { label: 'Regular Users', value: regularUsers, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: UserCheck },
              { label: 'Guests', value: guests, color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: User },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div className="col-6 col-md-3 mb-3" key={i}>
                  <div style={{
                    background: s.bg, border: `1px solid ${s.border}`,
                    borderRadius: 12, padding: '20px 24px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <Icon size={20} color={s.color} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table */}
          <div style={{
            background: 'white', borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                All Users ({users.length})
              </h3>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div className="spinner-border" style={{ color: '#0d9488' }} />
                <p style={{ marginTop: 16, color: '#6b7280' }}>Loading users...</p>
              </div>
            ) : error ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#dc2626' }}>
                {error}
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
                No users found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Name', 'Email', 'Role', 'Type'].map(h => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'left',
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
                    {users.map((user, i) => (
                      <tr key={user._id} style={{
                        borderBottom: i < users.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: '#f0fdfa', display: 'flex',
                              alignItems: 'center', justifyContent: 'center'
                            }}>
                              <User size={16} color="#0d9488" />
                            </div>
                            {user.name || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={14} color="#9ca3af" />
                            {user.email}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: user.role === 'admin' || user.isAdmin ? '#f5f3ff' : '#eff6ff',
                            color: user.role === 'admin' || user.isAdmin ? '#7c3aed' : '#2563eb',
                          }}>
                            {user.role === 'admin' || user.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: user.isGuest ? '#fef3c7' : '#f3f4f6',
                            color: user.isGuest ? '#d97706' : '#6b7280',
                          }}>
                            {user.isGuest ? 'Guest' : 'Registered'}
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
      </div>
    </>
  )
}

export default UserManagement