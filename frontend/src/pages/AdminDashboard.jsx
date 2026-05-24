import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import API from "../services/api";

import {
  Pill, ShieldAlert, LogOut, Users, Trash2, UserCog,
  Activity, Shield, Database, TrendingUp, MoreVertical,X
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ users: 0, admins: 0, medications: 0, activeUsers: 0 })
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState(null) // NEW
  const [userDetails, setUserDetails] = useState(null) // NEW
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const isAdmin = user?.role === 'admin' || user?.isAdmin === true

    if (!isAdmin) {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/stats')
      ])

      console.log('USERS API RESPONSE:', usersRes.data) // ADD THIS
      console.log('STATS API RESPONSE:', statsRes.data)

      setUsers(usersRes.data.users || [])
      setStats(statsRes.data || {})
    } catch (err) {
      console.error('API error:', err)
      if (err.response?.status === 403) {
        setAccessDenied(true)
      } else {
        toast.error('Failed to load admin data')
      }
    } finally {
      setLoading(false)
    }
  }

    // NEW: Fetch user details when row clicked
  const handleViewUser = async (userId) => {
    setDetailsLoading(true)
    setSelectedUser(userId)
    try {
      const { data } = await API.get(`/admin/users/${userId}`)
      setUserDetails(data)
    } catch (err) {
      toast.error('Failed to load user details')
      setSelectedUser(null)
    } finally {
      setDetailsLoading(false)
    }
  }


  const handleToggleAdmin = async (userId, currentIsAdmin) => {
    if (!window.confirm(`${currentIsAdmin? 'Remove' : 'Grant'} admin access?`)) return

    setActionLoading(userId)
    try {
      await API.put(`/admin/users/${userId}`)
      toast.success(currentIsAdmin? 'Admin removed' : 'Admin granted')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete ${name}? This will also delete all their medications. Cannot be undone.`)) return

    setActionLoading(userId)
    try {
      await API.delete(`/admin/users/${userId}`)
      toast.success('User deleted')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 text-sm mb-1">Your account lacks admin privileges.</p>
          <p className="text-gray-400 text-xs mb-6 font-mono">Logged in as: {user?.email || 'unknown'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gray-900 h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-50 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 w-9 h-9 rounded-lg flex items-center justify-center">
            <Pill size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-lg">MediTrack</span>
          <span className="bg-teal-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            ADMIN
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-gray-400 text-sm hidden md:block">{user?.email}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-4 py-1.5 rounded-lg text-sm transition"
          >
            User View
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Admin Control Panel</h1>
          <p className="text-gray-600">Manage users, permissions, and view platform statistics.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.users, icon: Users, color: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
            { label: 'Admins', value: stats.admins, icon: Shield, color: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
            { label: 'Medications', value: stats.medications, icon: Database, color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
            { label: 'Active Users', value: stats.activeUsers, icon: TrendingUp, color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} ${s.border} border rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-2">
                <s.icon size={20} className={s.text} />
              </div>
              <div className={`text-3xl font-extrabold ${s.text} mb-1`}>{loading? '—' : s.value}</div>
              <div className={`text-sm font-semibold ${s.text} opacity-80`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-700" />
              <h3 className="text-lg font-bold text-gray-900">All Users ({filteredUsers.length})</h3>
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          {loading? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0? (
            <div className="p-12 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['User', 'Email', 'Role', 'Streak', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
          <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleViewUser(u._id)} // ADD THIS
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{u.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{u._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.isAdmin
                          ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.isAdmin && <Shield size={12} />}
                          {u.isAdmin? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Activity size={14} className={u.streak?.count > 0? 'text-emerald-600' : 'text-gray-400'} />
                          <span className="text-sm font-semibold text-gray-900">{u.streak?.count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}> {/* ADD THIS */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAdmin(u._id, u.isAdmin)}
                            disabled={actionLoading === u._id || u._id === user._id}
                            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <UserCog size={14} />
                            {u.isAdmin? 'Remove' : 'Make'} Admin
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            disabled={actionLoading === u._id || u._id === user._id}
                            className="bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

                {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            {detailsLoading? (
              <div className="p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading user details...</p>
              </div>
            ) : userDetails? (
              <>
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg">
                      {userDetails.user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{userDetails.user.name}</h3>
                      <p className="text-gray-500 text-sm">{userDetails.user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Role</div>
                      <div className="font-semibold capitalize">{userDetails.user.role}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Streak</div>
                      <div className="font-semibold">{userDetails.user.streak?.count || 0} days</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Joined</div>
                      <div className="font-semibold">{new Date(userDetails.user.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Total Meds</div>
                      <div className="font-semibold">{userDetails.medications.length}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Pill size={20} className="text-teal-600"/>
                      Medications ({userDetails.medications.length})
                    </h4>
                    {userDetails.medications.length === 0? (
                      <p className="text-gray-500 text-sm">No medications added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {userDetails.medications.map(med => (
                          <div key={med._id} className="border rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-sm">{med.name}</div>
                              <div className="text-xs text-gray-500">{med.dosage} • {med.frequency}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              med.status === 'Taken'? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {med.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
    <ToastContainer position="bottom-right" />
  </div>
  )
}

export default AdminDashboard