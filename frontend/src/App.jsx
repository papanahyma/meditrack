import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import React, { useEffect } from 'react'
import axios from 'axios'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AddMedication from './pages/AddMedication'
import MedicationList from './pages/MedicationList'
import RemainderPage from './pages/RemainderPage'
import InventoryTracker from './pages/InventoryTracker'
import Analytics from './pages/Analytics'
import PharmacyLocator from './pages/PharmacyLocator'
import Caregiver from './pages/Caregiver'
import AdminDashboard from './pages/AdminDashboard'
import EditMedication from './pages/EditMedication'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UserManagement from './pages/admin/UserManagement'
import Alarm from './pages/Alarm'
import Logbook from './pages/Logbook'


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

const App = () => {

  useEffect(() => {
    const subscribeUser = async () => {
      try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || 'null')

        // Don't subscribe guests or unauthenticated users
        if (!token || !user || user.isGuest) return

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.log('Push not supported in this browser')
          return
        }

        // ✅ FIX: Check permission BEFORE requesting
        // If already denied, don't ask again — it annoys users
        if (Notification.permission === 'denied') {
          console.log('Notifications blocked by user')
          return
        }

        // Request permission only if not yet granted
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') return
        }

        // Register SW
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // ✅ FIX: Check if already subscribed — don't re-subscribe
        let subscription = await reg.pushManager.getSubscription()

        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              import.meta.env.VITE_VAPID_PUBLIC_KEY
            )
          })
          console.log('✅ New push subscription created')
        } else {
          console.log('✅ Already subscribed — reusing existing subscription')
        }

        // ✅ FIX: Only POST to backend once — use a session flag
        // so page navigations don't re-POST every time App mounts
        const alreadySaved = sessionStorage.getItem('pushSaved')
        if (alreadySaved) return

      await axios.post(
        `${import.meta.env.VITE_API_URL}/push/subscribe`,
        { userId: user._id, subscription },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        sessionStorage.setItem('pushSaved', 'true')
        console.log('✅ Push subscription saved to backend')

      } catch (err) {
        console.log('❌ Push subscribe failed:', err.message)
      }
    }

    subscribeUser()
  }, []) // runs once on mount

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-medication" element={<AddMedication />} />
          <Route path="/medications" element={<MedicationList />} />
          <Route path="/remainders" element={<RemainderPage />} />
          <Route path="/inventory" element={<InventoryTracker />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/pharmacy" element={<PharmacyLocator />} />
          <Route path="/caregiver" element={<Caregiver />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/edit-medication/:id" element={<EditMedication />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/alarm" element={<Alarm />} />
          <Route path="/logbook" element={<Logbook />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
