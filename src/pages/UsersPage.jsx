import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'
import { api } from '../lib/api'
import { useToast } from '../lib/ToastContext'
import { AlertTriangle, User, Mail, Phone, Building, Calendar, Info, RefreshCw } from 'lucide-react'

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [activeTab, setActiveTab] = useState('seeker')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [rejectNote, setRejectNote] = useState('')

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null)

  const toast = useToast()

  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const load = async (roleOverride) => {
    setError('')
    setLoading(true)
    try {
      const currentRole = roleOverride !== undefined ? roleOverride : activeTab
      if (currentRole === 'rolSwitch') {
        const { data } = await api.get('/admin/role-switch-requests', { params: { status: 'pending' } })
        setItems(data?.items || [])
      } else {
        const { data } = await api.get('/admin/users', { params: { q, role: currentRole, limit: 100 } })
        setItems(data?.items || [])
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(activeTab) }, [activeTab])

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
      message: `"${u.full_name || u.email}" istifadəçisini silmək istəyirsiniz? Səbəbi aşağıda qeyd edin:`
    })
    setDeletionReason('')
    setConfirmOpen(true)
  }

  const handleApproveSwitchClick = (req) => {
    setConfirmAction({
      type: 'approveSwitch',
      id: req.id,
      title: 'Rol dəyişikliyini təsdiqlə',
      message: `"${req.user?.full_name || req.user?.phone || req.user_id}" istifadəçisinin işçi axtarana keçməsini təsdiqləmək istəyirsiniz? (${req.company_name})`
    })
    setRejectNote('')
    setConfirmOpen(true)
  }

  const handleRejectSwitchClick = (req) => {
    setConfirmAction({
      type: 'rejectSwitch',
      id: req.id,
      title: 'Rol dəyişikliyini rədd et',
      message: `"${req.user?.full_name || req.user?.phone || req.user_id}" istifadəçisinin rol dəyişikliyi sorğusunu rədd etmək istəyirsiniz?`
    })
    setRejectNote('')
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
        if (!deletionReason.trim()) {
           toast.error("Silinmə səbəbi mütləqdir");
           setProcessing(false);
           return;
        }
        await api.delete(`/admin/users/${confirmAction.id}`, { data: { reason: deletionReason } })
        toast.success("İstifadəçi uğurla silindi")
      } else if (confirmAction.type === 'approveSwitch') {
        await api.post(`/admin/role-switch-requests/${confirmAction.id}/approve`)
        toast.success("Rol dəyişikliyi təsdiqləndi")
      } else if (confirmAction.type === 'rejectSwitch') {
        if (!rejectNote.trim()) {
          toast.error('Rədd səbəbini yazın')
          setProcessing(false)
          return
        }
        await api.post(`/admin/role-switch-requests/${confirmAction.id}/reject`, { note: rejectNote.trim() })
        toast.success("Rol dəyişikliyi rədd edildi")
      }
      setConfirmOpen(false)
      setConfirmAction(null)
      await load(activeTab)
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Xəta baş verdi')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Layout title="İstifadəçilər" subtitle="İstifadəçiləri, elanları və proses loqlarını idarə edin.">
      
      <div className="tabContainer">
        <div 
          className={`tabItem ${activeTab === 'seeker' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('seeker'); setCurrentPage(1); }}
        >
          İş axtaranlar
        </div>
        <div 
          className={`tabItem ${activeTab === 'employer' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('employer'); setCurrentPage(1); }}
        >
          İşçi axtaranlar
        </div>
        <div
          className={`tabItem ${activeTab === 'rolSwitch' ? 'active' : ''}`}
          onClick={() => { setActiveTab('rolSwitch'); setCurrentPage(1); }}
        >
          <RefreshCw size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Rol sorğuları
        </div>
      </div>

      <div className="card">
        {activeTab !== 'rolSwitch' && (
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <input
                className="input"
                placeholder="Ad / şirkət / telefon axtar..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
                onKeyDown={(e) => e.key === 'Enter' && load(activeTab)}
                style={{ minWidth: 260 }}
              />
              <button className="btn primary" onClick={() => load(activeTab)} disabled={loading}>Axtar</button>
            </div>
            <div className="muted">{loading ? 'Yüklənir…' : `${items.length} istifadəçi`}</div>
          </div>
        )}
        {activeTab === 'rolSwitch' && (
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Gözləyən rol dəyişikliyi sorğuları</div>
            <div className="row">
              <div className="muted" style={{ marginRight: 12 }}>{loading ? 'Yüklənir…' : `${items.length} sorğu`}</div>
              <button className="btn" onClick={() => load('rolSwitch')} disabled={loading}>Yenilə</button>
            </div>
          </div>
        )}

        {error ? <div className="pill bad" style={{ marginTop: 12 }}>{error}</div> : null}

        {activeTab === 'rolSwitch' ? (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>İstifadəçi</th>
                  <th>Şirkət</th>
                  <th>Sahə</th>
                  <th>Tarix</th>
                  <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((req, idx) => (
                  <tr key={req.id}>
                    <td className="muted font-mono">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.user?.full_name || '-'}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{req.user?.phone || req.user?.email || '-'}</div>
                    </td>
                    <td>{req.company_name || '-'}</td>
                    <td className="muted">{req.category || '-'}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{new Date(req.requested_at).toLocaleString('az-AZ')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn good" onClick={() => handleApproveSwitchClick(req)} disabled={processing}>Təsdiqlə</button>
                        <button className="btn danger" onClick={() => handleRejectSwitchClick(req)} disabled={processing}>Rədd et</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!loading && items.length === 0) ? <tr><td colSpan="6" className="muted" style={{ padding: 40, textAlign: 'center' }}>Gözləyən sorğu yoxdur</td></tr> : null}
                {loading ? <tr><td colSpan="6" className="muted" style={{ padding: 40, textAlign: 'center' }}>Yüklənir…</td></tr> : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Status</th>
                  <th>Ad Soyad</th>
                  {activeTab === 'employer' && <th>Şirkət</th>}
                  <th>Reytinq</th>
                  <th>Telefon</th>
                  <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((u, idx) => (
                  <tr key={u.id}>
                    <td className="muted font-mono">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td>
                      {u.status === 'pending' ? <span className="pill warn">Gözləyir</span> :
                        u.status === 'suspended' ? <span className="pill bad">Blok</span> :
                          <span className="pill good">Aktiv</span>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.full_name || '-'}</td>
                    {activeTab === 'employer' && <td>{u.company_name || '-'}</td>}
                    <td>
                      {u.average_rating ? (
                        <span className="pill success">
                          ★ {Number(u.average_rating).toFixed(1)} <span style={{ opacity: 0.7, fontSize: 10 }}>({u.rating_count})</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="mono">{u.phone || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={() => setSelectedUser(u)}>
                          <Info size={14} />
                          Ətraflı
                        </button>
                        {u.status === 'pending' && (
                          <button className="btn good" onClick={() => handleApproveClick(u)} disabled={processing}>Təsdiqlə</button>
                        )}
                        <button className="btn danger" onClick={() => handleDeleteClick(u)} disabled={processing}>Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!loading && items.length === 0) ? <tr><td colSpan={activeTab === 'employer' ? "7" : "6"} className="muted" style={{ padding: 40, textAlign: 'center' }}>İstifadəçi yoxdur</td></tr> : null}
                {loading ? <tr><td colSpan={activeTab === 'employer' ? "7" : "6"} className="muted" style={{ padding: 40, textAlign: 'center' }}>Yüklənir…</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
        
        <Pagination 
          currentPage={currentPage} 
          totalItems={items.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* User Detail Modal */}
      <Modal
        open={!!selectedUser}
        title="İstifadəçi məlumatları"
        onClose={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <div className="formGrid">
            <div className="formRow">
              <div className="label"><User size={12} style={{ marginRight: 4 }} /> Ad Soyad</div>
              <div style={{ fontWeight: 600 }}>{selectedUser.full_name || '-'}</div>
            </div>
            <div className="formRow">
              <div className="label"><Mail size={12} style={{ marginRight: 4 }} /> Email</div>
              <div className="mono">{selectedUser.email || '-'}</div>
            </div>
            <div className="formRow">
              <div className="label"><Phone size={12} style={{ marginRight: 4 }} /> Telefon</div>
              <div className="mono">{selectedUser.phone || '-'}</div>
            </div>
            <div className="formRow">
              <div className="label"><Info size={12} style={{ marginRight: 4 }} /> Rol</div>
              <div className="pill">{selectedUser.role === 'seeker' ? 'İş axtaran' : 'İşçi axtaran'}</div>
            </div>
            {selectedUser.role === 'employer' && (
              <div className="formRow">
                <div className="label"><Building size={12} style={{ marginRight: 4 }} /> Şirkət</div>
                <div>{selectedUser.company_name || '-'}</div>
              </div>
            )}
            <div className="formRow">
              <div className="label"><Calendar size={12} style={{ marginRight: 4 }} /> Qeydiyyat tarixi</div>
              <div className="muted">{new Date(selectedUser.created_at).toLocaleString('az-AZ')}</div>
            </div>
            <div className="formRow">
              <div className="label">Status</div>
              <div>
                {selectedUser.status === 'pending' ? <span className="pill warn">Gözləyir</span> :
                  selectedUser.status === 'suspended' ? <span className="pill bad">Blok</span> :
                    <span className="pill good">Aktiv</span>}
              </div>
            </div>
            <div className="formRow">
                <div className="label">UUID</div>
                <div className="mono muted" style={{ fontSize: 11 }}>{selectedUser.id}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        open={confirmOpen}
        title={confirmAction?.title || 'Təsdiqlə'}
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setConfirmOpen(false)} disabled={processing}>Ləğv et</button>
            <button
              className={`btn ${confirmAction?.type === 'delete' || confirmAction?.type === 'rejectSwitch' ? 'danger' : 'primary'}`}
              onClick={performAction}
              disabled={processing}
            >
              {processing ? 'İcra olunur...' : (
                confirmAction?.type === 'delete' ? 'Sil' :
                confirmAction?.type === 'rejectSwitch' ? 'Rədd et' :
                'Təsdiqlə'
              )}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: (confirmAction?.type === 'delete' || confirmAction?.type === 'rejectSwitch') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
            <AlertTriangle size={32} color={(confirmAction?.type === 'delete' || confirmAction?.type === 'rejectSwitch') ? '#ef4444' : '#10b981'} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 12 }}>
            {confirmAction?.message}
          </p>

          {confirmAction?.type === 'delete' && (
            <textarea
              className="input"
              placeholder="Silinmə səbəbini bura qeyd edin..."
              style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
            />
          )}

          {confirmAction?.type === 'rejectSwitch' && (
            <textarea
              className="input"
              placeholder="Rədd səbəbini yazın..."
              style={{ width: '100%', minHeight: 60, resize: 'vertical' }}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          )}
        </div>
      </Modal>

    </Layout>
  )
}
