import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout.jsx'
import Pagination from '../components/Pagination.jsx'
import { api } from '../lib/api'
import { Bell, CheckCircle, Info, AlertTriangle, MessageSquare } from 'lucide-react'

export default function NotificationsPage() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [markingAll, setMarkingAll] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/admin/events', { params: { limit: 150 } })
            const all = data?.items || []
            const requestEvents = all.filter((e) => e?.type === 'role_switch_request_pending' || e?.type === 'support_ticket')
            setItems(requestEvents)
        } catch (e) {
            toast.error('Bildirişləri yükləmək mümkün olmadı')
        } finally {
            setLoading(false)
        }
    }

    const markAllRead = async () => {
        if (markingAll) return
        setMarkingAll(true)
        try {
            localStorage.setItem('ASIMOS_ADMIN_NOTIF_SEEN_AT', String(Date.now()))
            toast.success('Hamısı oxunmuş olaraq qeyd edildi')
            await load()
        } catch (e) {
            toast.error('Xəta baş verdi')
        } finally {
            setMarkingAll(false)
        }
    }

    const seenAt = Number(localStorage.getItem('ASIMOS_ADMIN_NOTIF_SEEN_AT') || 0)
    const unreadCount = (items || []).filter((it) => {
      const ts = new Date(it.created_at).getTime()
      return Number.isFinite(ts) && ts > seenAt
    }).length

    const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <Layout title="Bildirişlər" subtitle="Sistem tərəfindən göndərilən bütün mühüm bildirişlər.">
            <div className="card">
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, margin: 0 }}>Bütün Bildirişlər</h2>
                    <button 
                        className="btn ghost" 
                        disabled={markingAll || unreadCount === 0}
                        onClick={markAllRead}
                    >
                        <CheckCircle size={16} style={{ marginRight: 8 }} />
                        Hamısını oxunmuş et
                    </button>
                </div>

                {loading ? (
                    <div className="muted" style={{ padding: 40, textAlign: 'center' }}>Yüklənir...</div>
                ) : items.length === 0 ? (
                    <div className="muted" style={{ padding: 40, textAlign: 'center' }}>Hələ heç bir bildiriş yoxdur.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {paginatedItems.map(it => {
                                                        const eventData = it.metadata || {}
                                                        const ts = new Date(it.created_at).getTime()
                                                        const isUnread = Number.isFinite(ts) && ts > seenAt
                                                        const isRoleSwitch = it.type === 'role_switch_request_pending'
                                                        const isSupport = it.type === 'support_ticket'

                                                        const title = isRoleSwitch
                                                            ? 'Yeni rol dəyişikliyi sorğusu'
                                                            : isSupport
                                                                ? 'Yeni dəstək müraciəti'
                                                                : it.type

                                                        const body = isRoleSwitch
                                                            ? `${eventData?.companyName || 'Şirkət göstərilməyib'} • istifadəçi: ${eventData?.requestId || '-'}`
                                                            : isSupport
                                                                ? `${eventData?.subject || 'Dəstək müraciəti'} • status: ${eventData?.status || '-'}`
                                                                : JSON.stringify(eventData || {})

                            return (
                                <div 
                                    key={it.id} 
                                    className="row"
                                    style={{
                                        padding: '16px 20px',
                                        background: isUnread ? 'var(--bg2)' : 'transparent',
                                        borderBottom: '1px solid var(--stroke)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        gap: 16
                                    }}
                                >
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: isRoleSwitch ? '#DBEAFE' : (isSupport ? '#DCFCE7' : '#F3F4F6'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isRoleSwitch ? '#2563EB' : (isSupport ? '#16A34A' : '#6B7280')
                                    }}>
                                        {isRoleSwitch ? <Bell size={20} /> : (isSupport ? <MessageSquare size={20} /> : <AlertTriangle size={20} />)}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: 15, color: 'var(--text1)' }}>{title}</div>
                                        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 2 }}>{body}</div>
                                        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{new Date(it.created_at).toLocaleString('az-AZ')}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                
                <Pagination
                  currentPage={currentPage}
                  totalItems={items.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
            </div>
        </Layout>
    )
}
