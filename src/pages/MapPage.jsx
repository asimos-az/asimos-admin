import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
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
      try { map.removeLayer(layer) } catch {}
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

export default function MapPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])

  const [cat, setCat] = useState('')
  const [showMarkers, setShowMarkers] = useState(true)
  const [showHeat, setShowHeat] = useState(true)

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

  const center = useMemo(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng]
    return [40.4093, 49.8671] // Bakı
  }, [markers.length])

  return (
    <Layout title="Xəritə" subtitle="Bütün vakansiyalar marker kimi və istilik xəritəsi (heatmap) kimi görünür.">
      <div className="grid2" style={{ gap: 14 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Vakansiyalar xəritəsi</div>
              <div className="muted" style={{ marginTop: 4 }}>
                {loading ? 'Yüklənir…' : `Göstərilir: ${markers.length} (filtr) / ${jobs.length} (hamısı)`}
              </div>
            </div>

            <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="">Bütün kateqoriyalar</option>
                {(categories || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <label className="check">
                <input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} />
                Marker
              </label>
              <label className="check">
                <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
                İstilik xəritəsi
              </label>
              <button className="btn" onClick={load} disabled={loading}>Yenilə</button>
            </div>
          </div>

          {error ? <div className="pill bad" style={{ marginTop: 12 }}>{error}</div> : null}

          <div className="mapWrap" style={{ marginTop: 12 }}>
            <MapContainer center={center} zoom={12} scrollWheelZoom className="leafletMap">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <HeatLayer enabled={showHeat} points={points} />

              {showMarkers ? markers.map((m) => (
                <Marker key={m.id} position={[m.lat, m.lng]}>
                  <Popup>
                    <div style={{ minWidth: 240 }}>
                      <div style={{ fontWeight: 900 }}>{m.title}</div>
                      <div className="muted" style={{ marginTop: 4 }}>Kateqoriya: {m.category || '-'}</div>
                      <div className="muted">Maaş: {m.wage || '-'}</div>
                      <div className="muted">Gündəlik: {m.isDaily ? 'Bəli' : 'Xeyr'}</div>
                      {m.address ? <div style={{ marginTop: 8 }}>{m.address}</div> : null}
                      <div className="muted" style={{ marginTop: 8 }}>Tarix: {m.createdAt ? new Date(m.createdAt).toLocaleString('az-AZ') : '-'}</div>
                    </div>
                  </Popup>
                </Marker>
              )) : null}
            </MapContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 900, fontSize: 16 }}>Ən çox vakansiya olan ərazilər</div>
          <div className="muted" style={{ marginTop: 4 }}>Ünvan məlumatına əsasən (təxmini).</div>

          <div style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ərazi</th>
                  <th style={{ width: 90 }}>Say</th>
                </tr>
              </thead>
              <tbody>
                {topAreas.map(([name, count]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 700 }}>{name}</td>
                    <td className="muted">{count}</td>
                  </tr>
                ))}
                {!loading && topAreas.length === 0 ? (
                  <tr><td colSpan="2" className="muted">Məlumat yoxdur.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            Qeyd: Heatmap yalnız lat/lng olan elanlardan qurulur. Lokasiya olmayan elanlar xəritədə görünməyəcək.
          </div>
        </div>
      </div>
    </Layout>
  )
}
