import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../lib/api'
import { useToast } from '../lib/ToastContext'
import { AlertTriangle } from 'lucide-react'

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'delete' | 'approve', id: string, title: string }
  const [processing, setProcessing] = useState(false)

  const toast = useToast()

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', { params: { q, role, limit: 50 } })
      setItems(data?.items || [])
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Action Handlers
  const handleApproveClick = (u) => {
    setConfirmAction({
      type: 'approve',
      id: u.id,
      title: 'İstifadəçini təsdiqlə',
      message: `"${u.full_name || u.email}" istifadəçisini təsdiqləmək istəyirsiniz?`
    })
    setConfirmOpen(true)
  }

  const handleDeleteClick = (u) => {
    setConfirmAction({
      type: 'delete',
      id: u.id,
      title: 'İstifadəçini sil',
      message: `"${u.full_name || u.email}" istifadəçisini silmək istəyirsiniz? Bu əməl geri qaytarıla bilməz.`
    })
    setConfirmOpen(true)
  }

  const performAction = async () => {
    if (!confirmAction) return
    setProcessing(true)
    try {
      if (confirmAction.type === 'approve') {
        await api.patch(`/admin/users/${confirmAction.id}`, { status: 'active' })
        toast.success("İstifadəçi uğurla təsdiqləndi")
      } else if (confirmAction.type === 'delete') {
        await api.delete(`/admin/users/${confirmAction.id}`)
        toast.success("İstifadəçi uğurla silindi")
      }
      setConfirmOpen(false)
      setConfirmAction(null)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Xəta baş verdi')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Layout title="İstifadəçilər">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="Ad / şirkət / telefon axtar..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Bütün rollar</option>
              <option value="seeker">İş axtaran</option>
              <option value="employer">İşçi axtaran</option>
            </select>
            <button className="btn" onClick={load} disabled={loading}>Axtar</button>
          </div>
          <div className="muted">{loading ? 'Yüklənir…' : `${items.length} istifadəçi`}</div>
        </div>
        {error ? <div className="pill bad" style={{ marginTop: 12 }}>{error}</div> : null}

        <div className="tableWrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Ad Soyad</th>
                <th>Rol</th>
                <th>Şirkət</th>
                <th>Reytinq</th>
                <th>Telefon</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="mono" style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.id}</td>
                  <td>
                    {u.status === 'pending' ? <span className="pill warn">Gözləyir</span> :
                      u.status === 'suspended' ? <span className="pill bad">Blok</span> :
                        <span className="pill good">Aktiv</span>}
                  </td>
                  <td>{u.full_name || '-'}</td>
                  <td><span className="pill">{u.role || '-'}</span></td>
                  <td>{u.company_name || '-'}</td>
                  <td>
                    {u.average_rating ? (
                      <span className="pill success">
                        ★ {Number(u.average_rating).toFixed(1)} <span style={{ opacity: 0.7, fontSize: 10 }}>({u.rating_count})</span>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="mono">{u.phone || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.status === 'pending' && (
                      <button className="btn good" onClick={() => handleApproveClick(u)} disabled={processing} style={{ marginRight: 8 }}>Təsdiqlə</button>
                    )}
                    {/* Edit button removed as requested */}
                    <button className="btn danger" onClick={() => handleDeleteClick(u)} disabled={processing}>Sil</button>
                  </td>
                </tr>
              ))}
              {(!loading && items.length === 0) ? <tr><td colSpan="8" className="muted">İstifadəçi yoxdur</td></tr> : null}
              {loading ? <tr><td colSpan="8" className="muted">Yüklənir…</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={confirmOpen}
        title={confirmAction?.title || 'Təsdiqlə'}
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setConfirmOpen(false)} disabled={processing}>Ləğv et</button>
            <button
              className={`btn ${confirmAction?.type === 'delete' ? 'danger' : 'primary'}`}
              onClick={performAction}
              disabled={processing}
            >
              {processing ? 'İcra olunur...' : (confirmAction?.type === 'delete' ? 'Sil' : 'Təsdiqlə')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: confirmAction?.type === 'delete' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
            <AlertTriangle size={32} color={confirmAction?.type === 'delete' ? '#ef4444' : '#10b981'} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', margin: 0 }}>
            {confirmAction?.message}
          </p>
        </div>
      </Modal>

    </Layout>
  )
}
