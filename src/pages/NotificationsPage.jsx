import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import { Bell, CheckCircle, ChevronRight, Info, AlertTriangle } from 'lucide-react'

export default function NotificationsPage() {
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [markingAll, setMarkingAll] = useState(false)

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/me/notifications', { params: { limit: 100 } })
            setItems(data?.items || [])
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
            await api.post('/me/notifications/read-all')
            setItems(prev => prev.map(it => ({ ...it, read_at: it.read_at || new Date().toISOString() })))
            toast.success('Hamısı oxunmuş olaraq qeyd edildi')
        } catch (e) {
            toast.error('Xəta baş verdi')
        } finally {
            setMarkingAll(false)
        }
    }

    const onNotificationClick = async (notif) => {
        if (!notif.read_at) {
            try {
                api.patch(`/me/notifications/${notif.id}/read`)
                setItems(prev => prev.map(it => it.id === notif.id ? { ...it, read_at: new Date().toISOString() } : it))
            } catch (e) {}
        }

        const data = notif.data || {}
        if (data.type === 'new_job' && data.id) {
            navigate(`/jobs/${data.id}`)
        } else if (data.type === 'rating' && data.job_id) {
            navigate(`/jobs/${data.job_id}`)
        }
    }

    return (
        <Layout title="Bildirişlər" subtitle="Sistem tərəfindən göndərilən bütün mühüm bildirişlər.">
            <div className="card">
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, margin: 0 }}>Bütün Bildirişlər</h2>
                    <button 
                        className="btn ghost" 
                        disabled={markingAll || items.filter(it => !it.read_at).length === 0}
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
                        {items.map(it => {
                            const isUnread = !it.read_at
                            const isRating = it.data?.type === 'rating'
                            const isNewJob = it.data?.type === 'new_job'

                            return (
                                <div 
                                    key={it.id} 
                                    className="row"
                                    onClick={() => onNotificationClick(it)}
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
                                        background: isRating ? '#FEF3C7' : (isNewJob ? '#DBEAFE' : '#F3F4F6'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isRating ? '#D97706' : (isNewJob ? '#2563EB' : '#6B7280')
                                    }}>
                                        {isRating ? <AlertTriangle size={20} /> : (isNewJob ? <Bell size={20} /> : <Info size={20} />)}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: 15, color: 'var(--text1)' }}>{it.title}</div>
                                        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 2 }}>{it.body}</div>
                                        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{new Date(it.created_at).toLocaleString('az-AZ')}</div>
                                    </div>

                                    {(isNewJob || isRating) && (
                                        <ChevronRight size={18} className="muted" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}
