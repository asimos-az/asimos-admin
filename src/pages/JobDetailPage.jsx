import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

export default function JobDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        load()
    }, [id])

    const load = async () => {
        setLoading(true)
        try {
            // Trying public endpoint first, it supports authUser so it should return data for admin too
            const { data } = await api.get(`/jobs/${id}`)
            setJob(data)
        } catch (e) {
            // If public fails (e.g. strict RLS), try admin list and filter (fallback) or generic error
            console.error(e)
            setError(e?.response?.data?.error || e.message || 'Elan tapılmadı')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (newStatus) => {
        if (!confirm(`Statusu "${newStatus}" olaraq dəyişmək istəyirsiniz?`)) return
        setProcessing(true)
        try {
            await api.patch(`/admin/jobs/${id}`, { status: newStatus })
            await load()
        } catch (e) {
            alert(e?.response?.data?.error || e.message)
        } finally {
            setProcessing(false)
        }
    }

    const del = async () => {
        if (!confirm('Bu elanı SİLMƏK istəyirsiniz? Geri qaytarmaq mümkün olmayacaq.')) return
        setProcessing(true)
        try {
            await api.delete(`/admin/jobs/${id}`)
            navigate('/jobs')
        } catch (e) {
            alert(e?.response?.data?.error || e.message)
            setProcessing(false)
        }
    }

    if (loading) return <Layout><div className="p-4">Yüklənir...</div></Layout>
    if (error) return <Layout><div className="p-4 pill bad">{error}</div></Layout>
    if (!job) return <Layout><div className="p-4">Elan tapılmadı</div></Layout>

    const locationValid = job.location?.lat && job.location?.lng

    return (
        <Layout title={`Elan: ${job.title}`}>
            <div style={{ marginBottom: 20 }}>
                <button className="btn ghost" onClick={() => navigate('/jobs')}>&larr; Geri</button>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

                {/* Left Column: Details */}
                <div className="card">
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{job.title}</h2>
                        <div className="row">
                            {job.status === 'pending' && <span className="pill warn">Gözləyir</span>}
                            {job.status === 'open' && <span className="pill good">Aktiv</span>}
                            {job.status === 'closed' && <span className="pill">Bağlı</span>}
                        </div>
                    </div>

                    <table className="table" style={{ marginTop: 0 }}>
                        <tbody>
                            <tr>
                                <td className="muted" style={{ width: 140 }}>ID</td>
                                <td className="mono">{job.id}</td>
                            </tr>
                            <tr>
                                <td className="muted">Kateqoriya</td>
                                <td>{job.category}</td>
                            </tr>
                            <tr>
                                <td className="muted">Maaş</td>
                                <td>{job.wage ? `${job.wage} AZN` : 'Razılaşma ilə'}</td>
                            </tr>
                            <tr>
                                <td className="muted">Növ</td>
                                <td>{job.jobType === 'temporary' ? `Müvəqqəti (${job.durationDays} gün)` : 'Daimi'}</td>
                            </tr>
                            <tr>
                                <td className="muted">Gündəlik?</td>
                                <td>{job.isDaily ? 'Bəli' : 'Xeyr'}</td>
                            </tr>
                            <tr>
                                <td className="muted">Yaradan (User ID)</td>
                                <td className="mono">{job.createdBy}</td>
                            </tr>
                            <tr>
                                <td className="muted">Tarix</td>
                                <td>{new Date(job.createdAt).toLocaleString('az-AZ')}</td>
                            </tr>
                            <tr>
                                <td className="muted">Bitmə Tarixi</td>
                                <td>{job.expiresAt ? new Date(job.expiresAt).toLocaleString('az-AZ') : '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ marginTop: 24 }}>
                        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Təsvir</h3>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, background: 'var(--bg1)', padding: 12, borderRadius: 8 }}>
                            {job.description || 'Qeyd yoxdur'}
                        </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Əlaqə</h3>
                        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
                            {job.phone && <div className="pill">📞 {job.phone}</div>}
                            {job.whatsapp && <div className="pill good">💬 {job.whatsapp}</div>}
                            {job.link && <a href={job.link} target="_blank" rel="noreferrer" className="pill a1">🔗 Link</a>}
                        </div>
                        {job.voen && <div style={{ marginTop: 8 }} className="muted">VÖEN: {job.voen}</div>}
                    </div>

                    <div style={{ marginTop: 32, borderTop: '1px solid var(--stroke)', paddingTop: 16 }}>
                        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Əməliyyatlar</h3>
                        <div className="row" style={{ gap: 12 }}>
                            {job.status === 'pending' && (
                                <button className="btn good" onClick={() => updateStatus('open')} disabled={processing}>✅ Təsdiqlə</button>
                            )}
                            {job.status === 'open' && (
                                <button className="btn" onClick={() => updateStatus('closed')} disabled={processing}>🚫 Bağla</button>
                            )}
                            {job.status === 'closed' && (
                                <button className="btn" onClick={() => updateStatus('open')} disabled={processing}>🔄 Yenidən aç</button>
                            )}
                            <button className="btn danger" onClick={del} disabled={processing}>🗑 Sil</button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Map & Location */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 600 }}>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--stroke)', background: '#f9fafb' }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Lokasiya</h3>
                        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                            {job.location?.address || 'Ünvan qeyd olunmayıb'}
                        </div>
                        {locationValid && (
                            <div className="mono" style={{ fontSize: 11, marginTop: 4, color: '#6b7280' }}>
                                {job.location.lat}, {job.location.lng}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        {locationValid ? (
                            <MapContainer
                                center={[job.location.lat, job.location.lng]}
                                zoom={15}
                                style={{ width: '100%', height: '100%', minHeight: 500 }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[job.location.lat, job.location.lng]}>
                                    <Popup>{job.title}</Popup>
                                </Marker>
                            </MapContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', padding: 20 }}>
                                Xəritə məlumatı yoxdur
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </Layout>
    )
}
