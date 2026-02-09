import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import { MapContainer, Marker, Popup, TileLayer, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

function HeatLayer({ points, enabled }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !enabled) return
    if (!points || !points.length) return
    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 18,
      maxZoom: 14,
    })
    layer.addTo(map)
    return () => {
      try { map.removeLayer(layer) } catch { }
    }
  }, [map, enabled, points])
  return null
}

function parseArea(address) {
  const a = String(address || '').split(',').map((x) => x.trim()).filter(Boolean)
  if (!a.length) return 'Naməlum'
  // Remove country if exists
  const withoutCountry = a.filter((x) => x.toLowerCase() !== 'azerbaycan' && x.toLowerCase() !== 'azerbaijan')
  const arr = withoutCountry.length ? withoutCountry : a
  // Return last 2 segments as "Rayon, Şəhər"
  if (arr.length >= 2) return `${arr[arr.length - 2]}, ${arr[arr.length - 1]}`
  return arr[arr.length - 1]
}

async function fetchAllJobs({ q = '' }) {
  const limit = 200
  let offset = 0
  const all = []
  // Hard cap to avoid infinite loops
  for (let i = 0; i < 40; i++) {
    const { data } = await api.get('/admin/jobs', { params: { q, limit, offset } })
    const items = data?.items || []
    all.push(...items)
    if (items.length < limit) break
    offset += limit
  }
  return all
}


function MapFlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 })
  }, [center, zoom, map])
  return null
}

export default function MapPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])

  const [cat, setCat] = useState('')
  const [showMarkers, setShowMarkers] = useState(true)
  const [showHeat, setShowHeat] = useState(true)

  // State to control map view
  const [viewState, setViewState] = useState({ center: [40.4093, 49.8671], zoom: 12, trigger: 0 })

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const [jobsAll, catsRes] = await Promise.all([
        fetchAllJobs({ q: '' }),
        api.get('/categories'),
      ])
      setJobs(jobsAll || [])
      setCategories((catsRes?.data?.items || []).map((x) => x.name))
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return (jobs || []).filter((j) => {
      if (cat) return String(j.category || '').trim() === cat
      return true
    })
  }, [jobs, cat])

  const points = useMemo(() => {
    return (filtered || [])
      .filter((j) => Number.isFinite(Number(j.location_lat)) && Number.isFinite(Number(j.location_lng)))
      .map((j) => [Number(j.location_lat), Number(j.location_lng), 1])
  }, [filtered])

  const markers = useMemo(() => {
    return (filtered || [])
      .filter((j) => Number.isFinite(Number(j.location_lat)) && Number.isFinite(Number(j.location_lng)))
      .map((j) => ({
        id: j.id,
        title: j.title,
        category: j.category,
        wage: j.wage,
        address: j.location_address,
        isDaily: j.is_daily,
        lat: Number(j.location_lat),
        lng: Number(j.location_lng),
        createdAt: j.created_at,
      }))
  }, [filtered])

  const topAreas = useMemo(() => {
    const m = new Map()
    for (const j of filtered || []) {
      const key = parseArea(j.location_address)
      m.set(key, (m.get(key) || 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [filtered])

  // Initial center based on markers
  const center = useMemo(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng]
    return [40.4093, 49.8671] // Bakı
  }, [markers.length])

  const handleAreaClick = (areaName) => {
    // Find first job with this area AND valid coordinates
    const match = (filtered || []).find(j =>
      parseArea(j.location_address) === areaName &&
      Number.isFinite(Number(j.location_lat)) &&
      Number.isFinite(Number(j.location_lng))
    )

    if (match) {
      const lat = Number(match.location_lat)
      const lng = Number(match.location_lng)
      setViewState({ center: [lat, lng], zoom: 14, trigger: Date.now() })

      // Also scroll to map top if needed (optional)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <Layout title="Xəritə" subtitle="Bütün vakansiyalar marker kimi və istilik xəritəsi (heatmap) kimi görünür.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow2)', borderRadius: 'var(--r28)' }}>
          <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--stroke)', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Vakansiyalar xəritəsi</span>
                <div className="pill" style={{ fontSize: 12 }}>{markers.length} elan</div>
              </div>
              <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                Xəritədəki vakansiyalar və istilik xəritəsi (heatmap).
              </div>
            </div>

            <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ minWidth: 180 }}>
                <option value="">Bütün kateqoriyalar</option>
                {(categories || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <label className="check" style={{ userSelect: 'none', cursor: 'pointer' }}>
                <input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} />
                Marker
              </label>
              <label className="check" style={{ userSelect: 'none', cursor: 'pointer' }}>
                <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
                Heatmap
              </label>

              <div style={{ width: 1, height: 24, background: 'var(--stroke)', margin: '0 4px' }} />

              <button className="btn ghost" onClick={load} disabled={loading} title="Yenilə">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M21 21v-5h-5" /></svg>
              </button>
            </div>
          </div>

          {error ? <div className="pill bad" style={{ margin: 16 }}>{error}</div> : null}

          <div style={{ height: '70vh', minHeight: 600, width: '100%', position: 'relative' }}>
            <MapContainer center={center} zoom={12} scrollWheelZoom className="leafletMap" style={{ height: '100%', width: '100%' }}>
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Xəritə (OSM)">
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Peyk (Satellite)">
                  <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <MapFlyTo center={viewState.center} zoom={viewState.zoom} key={viewState.trigger} />

              <HeatLayer enabled={showHeat} points={points} />

              {showMarkers ? markers.map((m) => (
                <Marker key={m.id} position={[m.lat, m.lng]}>
                  <Popup>
                    <div style={{ minWidth: 240 }}>
                      <div style={{ fontWeight: 900, fontSize: 15 }}>{m.title}</div>
                      <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>Kateqoriya: <span style={{ color: '#111' }}>{m.category || '-'}</span></div>
                      <div className="muted" style={{ fontSize: 13 }}>Maaş: <span style={{ color: '#16a34a', fontWeight: 700 }}>{m.wage || '-'}</span></div>
                      <div className="muted" style={{ fontSize: 13 }}>Gündəlik: {m.isDaily ? 'Bəli' : 'Xeyr'}</div>
                      {m.address ? <div style={{ marginTop: 8, fontSize: 12, color: '#666', borderTop: '1px solid #eee', paddingTop: 6 }}>{m.address}</div> : null}
                      <div className="muted" style={{ marginTop: 4, fontSize: 11 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString('az-AZ') : '-'}</div>
                    </div>
                  </Popup>
                </Marker>
              )) : null}
            </MapContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 900, fontSize: 18 }}>Ən çox vakansiya olan ərazilər</div>
          <div className="muted" style={{ marginTop: 4 }}>Ünvan məlumatına əsasən (təxmini).</div>

          <div style={{ marginTop: 20 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ərazi</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Vakansiya sayı</th>
                </tr>
              </thead>
              <tbody>
                {topAreas.map(([name, count]) => (
                  <tr
                    key={name}
                    onClick={() => handleAreaClick(name)}
                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ fontWeight: 600, color: '#2563eb' }}>{name}</td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>{count}</td>
                  </tr>
                ))}
                {!loading && topAreas.length === 0 ? (
                  <tr><td colSpan="2" className="muted">Məlumat yoxdur.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="muted" style={{ marginTop: 16, fontSize: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Qeyd:</div>
            Heatmap yalnız lat/lng koordinatları olan elanlardan qurulur. Lokasiya olmayan elanlar xəritədə görünməyəcək. Siyahıdakı ərazilərə klikləyərək xəritədə baxa bilərsiniz.
          </div>
        </div>
      </div>
    </Layout>
  )
}
