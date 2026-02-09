import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import { ArrowRight, CheckCircle2, Lock, MapPin, Bell, RefreshCw, FileText, User } from 'lucide-react'

// Helper to display event type properly
function TypeBadge({ type }) {
  let color = 'gray'
  let icon = null
  let label = type

  if (type === 'admin_login_success') { color = 'green'; icon = <CheckCircle2 size={12} />; label = 'Admin Girişi' }
  if (type === 'auth_login') { color = 'green'; icon = <CheckCircle2 size={12} />; label = 'İstifadəçi Girişi' }
  if (type === 'auth_refreshed') { color = 'blue'; icon = <RefreshCw size={12} />; label = 'Sessiya Yeniləndi' }
  if (type === 'location_update') { color = 'purple'; icon = <MapPin size={12} />; label = 'Lokasiya' }
  if (type === 'push_token_saved') { color = 'orange'; icon = <Bell size={12} />; label = 'Push Token' }
  if (type === 'admin_job_created') { color = 'indigo'; icon = <FileText size={12} />; label = 'Elan (Admin)' }

  const style = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 99,
    fontSize: 12, fontWeight: 600,
    backgroundColor: `var(--${color}-50, #f3f4f6)`,
    color: `var(--${color}-700, #374151)`,
    border: `1px solid var(--${color}-200, #e5e7eb)`
  }

  return <span style={style}>{icon} {label}</span>
}

function ProcessDetail({ type, data }) {
  if (!data) return <span className="muted">-</span>

  // Try to parse if string
  let d = data
  if (typeof d === 'string') {
    try { d = JSON.parse(d) } catch { }
  }

  if (type === 'admin_login_success' || type === 'auth_login') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <User size={14} className="muted" />
        <span style={{ fontWeight: 600 }}>{d.email}</span>
      </div>
    )
  }

  if (type === 'location_update') {
    const loc = d.location || {}
    const addr = loc.address || `${loc.lat}, ${loc.lng}`
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MapPin size={14} className="text-purple-600" />
        <span title={JSON.stringify(loc)}>
          {parseFloat(loc.lat).toFixed(4)}, {parseFloat(loc.lng).toFixed(4)}
          {loc.address ? <span className="muted" style={{ marginLeft: 6 }}>({loc.address.substring(0, 20)}...)</span> : ''}
        </span>
      </div>
    )
  }

  if (type === 'push_token_saved') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bell size={14} className={d.hasToken ? 'text-green-600' : 'text-red-500'} />
        <span>{d.hasToken ? 'Token aktivdir' : 'Token yoxdur'}</span>
      </div>
    )
  }

  if (type === 'auth_refreshed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="pill" style={{ fontSize: 10 }}>{d.role}</span>
        <span>{d.email}</span>
      </div>
    )
  }

  if (type === 'admin_job_created') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="muted">ID:</span>
        <span className="mono" style={{ fontSize: 12 }}>{d.job_id?.substring(0, 8)}</span>
        <ArrowRight size={12} className="muted" />
        <span className="muted">By:</span>
        <span className="mono" style={{ fontSize: 12 }}>{d.created_by?.substring(0, 8)}</span>
      </div>
    )
  }

  return <span className="mono muted" style={{ fontSize: 12 }}>{JSON.stringify(d).substring(0, 50)}</span>
}
export default function EventsPage() {
  const [type, setType] = useState('')
  const [actorId, setActorId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')

  const load = async () => {
    setError('')
    setHint('')
    setLoading(true)
    try {
      const { data } = await api.get('/admin/events', { params: { type, actorId, limit: 100 } })
      setItems(data?.items || [])
      if (data?.eventsSetupRequired) {
        setHint(data?.hint || 'events cədvəli mövcud deyil. Supabase SQL Editor-də migrations faylını run edin.')
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Layout title="Proseslər">
      {error ? <div className="card"><div className="pill bad">{error}</div></div> : null}
      {hint ? <div className="card"><div className="pill">{hint}</div></div> : null}
      {hint ? <div className="card" style={{ marginTop: 12 }}><div className="pill">{hint}</div></div> : null}

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800 }}>Proses axını</div>
            <div className="muted">Qeydiyyat, giriş, lokasiya, elan yaratma və s. proseslər burada görünür.</div>
          </div>
          <div className="row">
            <input className="input" style={{ width: 180 }} placeholder="növ (məs: auth_login)" value={type} onChange={(e) => setType(e.target.value)} />
            <input className="input" style={{ width: 260 }} placeholder="actor_id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
            <button className="btn" onClick={load} disabled={loading}>{loading ? 'Yüklənir…' : 'Filtrlə'}</button>
          </div>
        </div>

        <div className="tableWrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vaxt</th>
                <th>Növ</th>
                <th>İstifadəçi</th>
                <th>Məlumat</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((ev) => (
                <tr key={ev.id}>
                  <td className="muted" style={{ fontSize: 13 }}>{new Date(ev.created_at).toLocaleString('az-AZ')}</td>
                  <td><TypeBadge type={ev.type} /></td>
                  <td className="mono" style={{ fontSize: 13 }}>
                    {ev.actor_id ? (
                      <span title={ev.actor_id}>{ev.actor_id.substring(0, 8)}…</span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    <ProcessDetail type={ev.type} data={ev.metadata} />
                  </td>
                </tr>
              ))}
              {(!loading && (items || []).length === 0) ? <tr><td colSpan="4" className="muted">Heç bir proses tapılmadı.</td></tr> : null}
              {loading ? <tr><td colSpan="4" className="muted">Yüklənir…</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
