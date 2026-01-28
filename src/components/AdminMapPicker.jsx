import React, { useEffect, useMemo, useState } from 'react'
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

function ClickToSet({ onPick }){
  useMapEvents({
    click(e){
      onPick(e.latlng)
    },
  })
  return null
}

export default function AdminMapPicker({ lat, lng, onChange }){
  const has = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
  const center = useMemo(() => {
    if (has) return [Number(lat), Number(lng)]
    // Bakı default
    return [40.4093, 49.8671]
  }, [lat, lng, has])

  const [key, setKey] = useState(0)
  useEffect(() => {
    // force relayout when modal opens
    const t = setTimeout(() => setKey((k) => k + 1), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="mapPicker">
      <MapContainer key={key} center={center} zoom={has ? 15 : 12} style={{ height: 260, width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToSet onPick={(ll)=>onChange?.({ lat: ll.lat, lng: ll.lng })} />
        {has ? <Marker position={[Number(lat), Number(lng)]} /> : null}
      </MapContainer>
      <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Xəritəyə klik edin – lat/lng avtomatik doldurulacaq.
      </div>
    </div>
  )
}
