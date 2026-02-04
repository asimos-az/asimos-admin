import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickToSet({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng)
    },
  })
  return null
}

async function nominatimSearchAZ(q) {
  const query = (q || '').trim()
  if (!query) return []
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '6')
  // Azerbaijan only
  url.searchParams.set('countrycodes', 'az')
  // Prefer results inside AZ bounding box (west,south,east,north)
  // Azerbaijan wide bounding box
  url.searchParams.set('viewbox', '44.0,38.0,51.0,42.0')
  url.searchParams.set('bounded', '1')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
    },
  })
  if (!res.ok) return []
  return await res.json()
}

export default function AdminMapPicker({ lat, lng, onChange }) {
  // Fix: strict check to avoid 0,0 (Ocean) on empty strings
  const has = lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && (Number(lat) !== 0 || Number(lng) !== 0)
  const center = useMemo(() => {
    if (has) return [Number(lat), Number(lng)]
    // Azerbaijan Center (approx)
    return [40.5, 47.5]
  }, [lat, lng, has])

  const mapRef = useRef(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [err, setErr] = useState('')

  const [key, setKey] = useState(0)
  useEffect(() => {
    // force relayout when modal opens
    const t = setTimeout(() => setKey((k) => k + 1), 50)
    return () => clearTimeout(t)
  }, [])

  const pick = ({ lat: la, lng: ln, label }) => {
    onChange?.({ lat: la, lng: ln, address: label })
    if (mapRef.current) mapRef.current.setView([la, ln], 16)
  }

  const doSearch = async () => {
    try {
      setErr('')
      setSearching(true)
      const r = await nominatimSearchAZ(q)
      setResults(Array.isArray(r) ? r : [])
    } catch (e) {
      setErr('Axtarış xətası')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mapPicker">
      <div className="mapSearchRow">
        <input
          className="input mapSearchInput"
          placeholder="Ünvan axtar (yalnız Azərbaycan)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch() }}
        />
        <button className="btn ghost" type="button" onClick={doSearch} disabled={searching || !q.trim()}>
          {searching ? 'Axtarılır…' : 'Axtar'}
        </button>
      </div>

      {err ? <div className="muted" style={{ color: '#b91c1c', marginTop: 8, fontSize: 12 }}>{err}</div> : null}

      {results?.length ? (
        <div className="mapSearchResults" role="listbox">
          {results.map((r) => (
            <button
              key={`${r.place_id}`}
              type="button"
              className="mapSearchItem"
              onClick={() => {
                setResults([])
                pick({ lat: Number(r.lat), lng: Number(r.lon), label: r.display_name })
              }}
            >
              <div className="mapSearchTitle">{r.display_name}</div>
              <div className="mapSearchMeta">{(r.address?.city || r.address?.town || r.address?.state || 'Azərbaycan')}</div>
            </button>
          ))}
        </div>
      ) : null}

      <MapContainer
        key={key}
        center={center}
        zoom={has ? 15 : 7}
        style={{ height: 260, width: '100%' }}
        whenCreated={(m) => { mapRef.current = m; }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToSet onPick={(ll) => pick({ lat: ll.lat, lng: ll.lng })} />
        {has ? <Marker position={[Number(lat), Number(lng)]} /> : null}
      </MapContainer>
      <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Xəritəyə klik edin – lat/lng avtomatik doldurulacaq.
      </div>
    </div>
  )
}
