import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api, API_BASE_URL } from '../lib/api'
import { getToken } from '../lib/auth'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { CheckCircle, Clock, RefreshCw, Search, XCircle } from 'lucide-react'

function statusLabel(status) {
  if (status === 'approved') return 'Təsdiqləndi'
  if (status === 'rejected') return 'Rədd edildi'
  return 'Gözləyir'
}

function statusClass(status) {
  if (status === 'approved') return 'good'
  if (status === 'rejected') return 'bad'
  return 'warn'
}

export default function ChangeRequestsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('pending')
  const [q, setQ] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadList()

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: { adminToken: getToken() },
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 800,
    })

    socket.on('profile-change-request:updated', () => loadList(true))
    socket.on('support:updated', () => loadList(true))

    const interval = setInterval(() => loadList(true), 15000)
    return () => {
      socket.disconnect()
      clearInterval(interval)
    }
  }, [status])

  async function loadList(silent = false) {
    try {
      if (!silent) setLoading(true)
      const params = status === 'all' ? '' : `?status=${status}`
      const res = await api.get(`/admin/profile-change-requests${params}`)
      const nextItems = res.data.items || []
      setItems(nextItems)
      setSelected((current) => {
        if (!current) return nextItems[0] || null
        return nextItems.find((item) => item.id === current.id) || nextItems[0] || null
      })
    } catch (e) {
      if (!silent) toast.error(e.response?.data?.error || e.message || 'Sorğular yüklənmədi')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function approveRequest() {
    if (!selected || selected.status !== 'pending') return
    if (!window.confirm('Bu dəyişiklik təsdiqlənsin və istifadəçi profilində dərhal yenilənsin?')) return

    try {
      setActionLoading(true)
      await api.patch(`/admin/profile-change-requests/${selected.id}/approve`, {})
      toast.success('Dəyişiklik təsdiqləndi və web profilində yeniləndi')
      await loadList(true)
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Təsdiqləmə alınmadı')
    } finally {
      setActionLoading(false)
    }
  }

  async function rejectRequest() {
    if (!selected || selected.status !== 'pending') return
    if (!window.confirm('Bu dəyişiklik sorğusu rədd edilsin?')) return

    try {
      setActionLoading(true)
      await api.patch(`/admin/profile-change-requests/${selected.id}/reject`, { reason: rejectReason })
      toast.success('Dəyişiklik sorğusu rədd edildi')
      setRejectReason('')
      await loadList(true)
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Rədd etmək alınmadı')
    } finally {
      setActionLoading(false)
    }
  }

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((item) => item.status === 'pending').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
  }), [items])

  const filteredItems = items.filter((item) => {
    const query = q.trim().toLowerCase()
    if (!query) return true
    const text = [
      item.field_label,
      item.old_value,
      item.new_value,
      item.status,
      item.profiles?.full_name,
      item.profiles?.company_name,
      item.profiles?.phone,
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(query)
  })

  return (
    <Layout title="Dəyişiklik sorğuları" subtitle="İşəgötürən panelindən gələn məlumat dəyişikliklərini təsdiqləyin və ya rədd edin.">
      <div className="card" style={{ minHeight: 'calc(100vh - 120px)', padding: 0, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 390, borderRight: '1px solid var(--stroke)', display: 'flex', flexDirection: 'column', background: 'var(--bg0)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--stroke)', display: 'grid', gap: 12 }}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {[
                ['pending', `Gözləyir (${counts.pending})`],
                ['approved', `Təsdiq (${counts.approved})`],
                ['rejected', `Rədd (${counts.rejected})`],
                ['all', 'Hamısı'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`pill ${status === value ? 'good' : ''}`}
                  onClick={() => setStatus(value)}
                  style={{ border: 0, cursor: 'pointer' }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="search" style={{ width: '100%' }}>
              <Search size={16} />
              <input placeholder="Sorğu axtar..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Yüklənir...</div> : null}
            {!loading && filteredItems.length === 0 ? <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Sorğu tapılmadı</div> : null}

            {filteredItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelected(item)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 0,
                  borderBottom: '1px solid var(--stroke)',
                  borderLeft: selected?.id === item.id ? '3px solid var(--a1)' : '3px solid transparent',
                  background: selected?.id === item.id ? '#fff' : 'transparent',
                  padding: 16,
                  cursor: 'pointer',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className={`pill ${statusClass(item.status)}`} style={{ fontSize: 11, padding: '3px 8px', height: 'auto' }}>{statusLabel(item.status)}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.field_label || item.field_key}</div>
                <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.profiles?.company_name || item.profiles?.full_name || 'İstifadəçi'}: {item.old_value || 'Boş'} → {item.new_value}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: '#fff', minWidth: 0 }}>
          {selected ? (
            <div style={{ padding: 24, display: 'grid', gap: 18 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>{selected.field_label || selected.field_key}</h2>
                  <div className="muted">
                    {selected.profiles?.company_name || selected.profiles?.full_name || 'İstifadəçi'} • {selected.profiles?.phone || '-'}
                  </div>
                </div>
                <span className={`pill ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 16 }}>
                  <div className="muted" style={{ marginBottom: 8 }}>Köhnə dəyər</div>
                  <div style={{ fontSize: 18, fontWeight: 700, wordBreak: 'break-word' }}>{selected.old_value || 'Boş idi'}</div>
                </div>
                <div className="card" style={{ padding: 16, borderColor: '#16a34a' }}>
                  <div className="muted" style={{ marginBottom: 8 }}>Yeni dəyər</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f8a62', wordBreak: 'break-word' }}>{selected.new_value}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <div className="muted" style={{ marginBottom: 10 }}>Texniki məlumat</div>
                <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                  <div><b>Field key:</b> {selected.field_key}</div>
                  <div><b>DB column:</b> {selected.db_column}</div>
                  <div><b>Göndərilmə:</b> {new Date(selected.created_at).toLocaleString()}</div>
                  {selected.decided_at ? <div><b>Cavab tarixi:</b> {new Date(selected.decided_at).toLocaleString()}</div> : null}
                  {selected.decided_by ? <div><b>Admin:</b> {selected.decided_by}</div> : null}
                  {selected.admin_note ? <div><b>Qeyd:</b> {selected.admin_note}</div> : null}
                </div>
              </div>

              {selected.status === 'pending' ? (
                <div className="card" style={{ padding: 16, display: 'grid', gap: 12 }}>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Rədd səbəbi (istəyə bağlı)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ minHeight: 92, resize: 'vertical' }}
                  />
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
                    <button className="btn outline" onClick={rejectRequest} disabled={actionLoading} style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
                      <XCircle size={18} />
                      Rədd et
                    </button>
                    <button className="btn primary" onClick={approveRequest} disabled={actionLoading}>
                      <CheckCircle size={18} />
                      Təsdiqlə və tətbiq et
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: 16 }}>
                  <div className="row" style={{ gap: 8 }}>
                    {selected.status === 'approved' ? <CheckCircle size={18} color="#16a34a" /> : <Clock size={18} />}
                    <b>{statusLabel(selected.status)}</b>
                  </div>
                </div>
              )}

              <button className="btn outline" onClick={() => loadList()} style={{ justifySelf: 'start' }}>
                <RefreshCw size={16} />
                Yenilə
              </button>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              Sorğu seçin
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
