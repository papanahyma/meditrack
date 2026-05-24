import React, { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Pill, PlusCircle, Bell,
  Package, BarChart2, Users, LogOut, User,
  Menu, X, Moon, Sun, Heart, MapPin, ShieldCheck
} from 'lucide-react'
import { ThemeContext } from '../context/ThemeContext'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { dark, toggleDark } = useContext(ThemeContext)

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    const user = storedUser?.user || storedUser;

    const isGuest = user?.isGuest;
    const isAdmin =
      user?.role === 'admin' ||
      user?.email === 'leylahpapana@gmail.com';

    console.log("STORED USER:", storedUser);
    console.log("FINAL USER:", user);
    console.log("ROLE:", user?.role);
    console.log("IS ADMIN:", isAdmin);

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/')
  }

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={15} /> },
    { label: 'Medications', path: '/medications', icon: <Pill size={15} /> },
    { label: 'Add', path: '/add-medication', icon: <PlusCircle size={15} /> },
    { label: 'Reminders', path: '/remainders', icon: <Bell size={15} /> },
    { label: 'Inventory', path: '/inventory', icon: <Package size={15} /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart2 size={15} /> },
    { label: 'Caregiver', path: '/caregiver', icon: <Users size={15} /> },
    { label: 'Pharmacy', path: '/pharmacy', icon: <MapPin size={15} /> },
  ]

  return (
    <>
      <nav style={{
        background: dark
          ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
          : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        padding: '0 28px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>

        {/* Logo */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{
            width: 36, height: 36,
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={18} color="white" fill="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', lineHeight: 1 }}>
              MediTrack
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, letterSpacing: '1px', marginTop: 1 }}>
              HEALTH MANAGER
            </div>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="d-none d-xl-flex" style={{ gap: 2, alignItems: 'center' }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.path
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.8)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {link.icon}
                {link.label}
              </button>
            )
          })}

          {/* Admin Button — only visible to admin */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: location.pathname === '/admin'
                  ? 'rgba(255,255,255,0.25)'
                  : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <ShieldCheck size={15} />
              Admin
            </button>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

{/* //dark mode button */}
        <button
          onClick={() => {
            toggleDark(); // calls your context function
            document.documentElement.classList.toggle('dark'); // ← Add this line
          }}
          style={{
            width: 36, height: 36,
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white',
            transition: 'background 0.15s',
          }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

          {isGuest && (
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white', fontSize: 11,
              padding: '4px 10px', borderRadius: 20, fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              GUEST
            </span>
          )}

          {/* Admin Badge - make it clickable */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white', fontSize: 11,
                padding: '4px 10px', borderRadius: 20, fontWeight: 700,
                letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              ADMIN
            </button>
          )}

          {/* Profile */}
          <div
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 15,
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <div className="d-none d-lg-block">
              <div style={{ color: 'white', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                {user?.name || 'Guest'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                {isGuest ? 'Guest Mode' : isAdmin ? 'Administrator' : 'My Account'}
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.15s',
            }}
          >
            <LogOut size={14} />
            <span className="d-none d-md-block">Sign Out</span>
          </button>

          {/* Mobile Toggle */}
          <button
            className="d-xl-none"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: dark ? '#1E293B' : '#0D9488',
          padding: '8px 16px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
        }} className="d-xl-none">
          {navLinks.map((link) => {
            const active = location.pathname === link.path
            return (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMenuOpen(false) }}
                style={{
                  background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  color: 'white', border: 'none',
                  borderRadius: 10, padding: '10px 8px',
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5,
                }}
              >
                {link.icon}
                {link.label}
              </button>
            )
          })}

          {/* Admin button in mobile menu */}
          {isAdmin && (
            <button
              onClick={() => { navigate('/admin'); setMenuOpen(false) }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '10px 8px',
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer', textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 5,
              }}
            >
              <ShieldCheck size={15} />
              Admin
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default Navbar