import React, { useState, useEffect, useRef } from 'react'
import Navbar from '../components/NavBar'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

const pharmacyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 14) }, [lat, lng, map])
  return null
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
}

const PharmacyLocator = () => {
  const GEOAPIFY_KEY = "bfbe33d7ea1e4350ae0513060cbda219"
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [pharmacies, setPharmacies] = useState([])
  const [showMap, setShowMap] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [fetchingPharmacies, setFetchingPharmacies] = useState(false)
  const markerRefs = useRef({})

  const fetchPharmacies = async (lat, lng) => {
    setFetchingPharmacies(true)
    try {
      const res = await fetch(
        `https://api.geoapify.com/v2/places?categories=healthcare.pharmacy&filter=circle:${lng},${lat},5000&limit=20&apiKey=${GEOAPIFY_KEY}`
      )
      const data = await res.json()
      const sorted = (data.features || []).sort((a, b) => {
        const dA = getDistance(lat, lng, a.geometry.coordinates[1], a.geometry.coordinates[0])
        const dB = getDistance(lat, lng, b.geometry.coordinates[1], b.geometry.coordinates[0])
        return dA - dB
      })
      setPharmacies(sorted)
    } catch (err) {
      console.log(err)
      setError('Failed to fetch pharmacies.')
    }
    setFetchingPharmacies(false)
  }

  const handleNearMe = () => {
    setLoading(true)
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocation({ lat, lng })
        setShowMap(true)
        setLoading(false)
        await fetchPharmacies(lat, lng)
      },
      () => {
        setError('Location access denied. Please allow location access.')
        setLoading(false)
      }
    )
  }

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(search)}&apiKey=${GEOAPIFY_KEY}`
      )
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates
        setLocation({ lat, lng })
        setShowMap(true)
        await fetchPharmacies(lat, lng)
      } else {
        setError('Location not found. Try a different search term.')
      }
    } catch (err) {
      setError('Failed to search location.')
    }
    setLoading(false)
  }

  const handleSidebarClick = (pharmacy, idx) => {
    setSelectedPharmacy(idx)
    const marker = markerRefs.current[idx]
    if (marker) marker.openPopup()
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Pharmacy Locator
          </h2>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            Find nearby pharmacies to refill your prescriptions.
          </p>
        </div>

        <div style={{
          background: 'white', borderRadius: 12,
          border: '1px solid #e5e7eb', padding: '24px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
            Search pharmacies by location
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Enter city, area, or pincode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ height: 46, borderRadius: 8, fontSize: 15, flex: 1 }}
            />
            <button
              onClick={handleSearch}
              style={{
                background: '#0d9488', color: 'white',
                border: 'none', borderRadius: 8,
                padding: '0 24px', fontWeight: 600,
                fontSize: 15, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {loading && !showMap ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleNearMe}
              style={{
                background: 'white', color: '#0d9488',
                border: '1.5px solid #0d9488', borderRadius: 8,
                padding: '0 20px', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {loading && !showMap ? '...' : 'Near Me'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 10, padding: '14px 20px',
            color: '#dc2626', fontWeight: 500, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {loading && !showMap && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="spinner-border" style={{ color: '#0d9488' }} role="status" />
            <p style={{ marginTop: 16, color: '#6b7280' }}>Detecting your location...</p>
          </div>
        )}

        {showMap && location && (
          <div style={{
            background: 'white', borderRadius: 12,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #f3f4f6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  Your Location Detected
                </span>
                <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 12 }}>
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              </div>
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/pharmacy/@${location.lat},${location.lng},14z`, '_blank')}
                style={{
                  background: 'transparent', color: '#0d9488',
                  border: '1px solid #0d9488', borderRadius: 6,
                  padding: '6px 14px', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Open in Google Maps
              </button>
            </div>

            <div style={{ display: 'flex', height: 420 }}>
              <div style={{ flex: 1 }}>
                <MapContainer
                  center={[location.lat, location.lng]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap lat={location.lat} lng={location.lng} />

                  <Marker position={[location.lat, location.lng]} icon={userIcon}>
                    <Popup><strong>You are here</strong></Popup>
                  </Marker>

                  {pharmacies.map((p, idx) => {
                    const [pLng, pLat] = p.geometry.coordinates
                    const name = p.properties.name || 'Pharmacy'
                    const address = p.properties.address_line2 || p.properties.formatted || ''
                    const dist = getDistance(location.lat, location.lng, pLat, pLng)
                    return (
                      <Marker
                        key={idx}
                        position={[pLat, pLng]}
                        icon={pharmacyIcon}
                        ref={(ref) => { if (ref) markerRefs.current[idx] = ref }}
                        eventHandlers={{ click: () => setSelectedPharmacy(idx) }}
                      >
                        <Popup>
                          <strong>{name}</strong>
                          <br />
                          {address}
                          <br />
                          <span style={{ color: '#0d9488' }}>{dist} km away</span>
                          <br />
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0d9488', fontWeight: 600 }}
                          >
                            Get Directions
                          </a>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              </div>

              <div style={{
                width: 260, borderLeft: '1px solid #e5e7eb',
                overflowY: 'auto', background: '#fafafa',
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
                  fontSize: 13, fontWeight: 700, color: '#111827',
                  background: 'white',
                }}>
                  Nearby Pharmacies
                  {fetchingPharmacies && (
                    <span style={{ marginLeft: 8, color: '#0d9488', fontWeight: 400 }}>Loading...</span>
                  )}
                  {!fetchingPharmacies && (
                    <span style={{ marginLeft: 8, color: '#6b7280', fontWeight: 400 }}>
                      ({pharmacies.length} found)
                    </span>
                  )}
                </div>

                {fetchingPharmacies ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div className="spinner-border spinner-border-sm" style={{ color: '#0d9488' }} role="status" />
                  </div>
                ) : pharmacies.length === 0 ? (
                  <div style={{ padding: 24, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
                    No pharmacies found nearby.
                  </div>
                ) : (
                  pharmacies.map((p, idx) => {
                    const [pLng, pLat] = p.geometry.coordinates
                    const name = p.properties.name || 'Pharmacy'
                    const address = p.properties.address_line2 || p.properties.formatted || ''
                    const dist = getDistance(location.lat, location.lng, pLat, pLng)
                    const isSelected = selectedPharmacy === idx
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSidebarClick(p, idx)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          background: isSelected ? '#f0fdfa' : 'white',
                          borderLeft: isSelected ? '3px solid #0d9488' : '3px solid transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{
                            background: '#0d9488', color: 'white',
                            borderRadius: '50%', width: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
                          }}>
                            {idx + 1}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                              {name}
                            </div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, lineHeight: 1.4 }}>
                              {address}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{
                                fontSize: 11, color: '#0d9488', fontWeight: 600,
                                background: '#f0fdfa', padding: '2px 6px', borderRadius: 4,
                              }}>
                                {dist} km
                              </span>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLng}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ fontSize: 11, color: '#0d9488', fontWeight: 600 }}
                              >
                                Route
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default PharmacyLocator