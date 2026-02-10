import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import { MessageSquare, User, Search, Send, CheckCircle, XCircle } from 'lucide-react'

export default function SupportPage() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [replyMsg, setReplyMsg] = useState('')
    const [replying, setReplying] = useState(false)
    const [q, setQ] = useState('')

    useEffect(() => {
        loadList()
    }, [])

    async function loadList() {
        try {
            setLoading(true)
            const res = await api.get('/admin/support')
            setTickets(res.data.items || [])
        } catch (e) {
            alert(e.message)
        } finally {
            setLoading(false)
        }
    }

    async function selectTicket(t) {
        try {
            const res = await api.get(`/admin/support/${t.id}`)
            setSelectedTicket(res.data)
        } catch (e) {
            alert(e.message)
        }
    }

    async function sendReply() {
        if (!replyMsg) return
        try {
            setReplying(true)
            await api.post(`/admin/support/${selectedTicket.id}/reply`, {
                message: replyMsg
            })
            setReplyMsg('')
            // refresh details
            await selectTicket(selectedTicket)
            // refresh list (status might change)
            loadList()
        } catch (e) {
            alert(e.message)
        } finally {
            setReplying(false)
        }
    }

    const filteredTickets = tickets.filter(t =>
        (t.subject || '').toLowerCase().includes(q.toLowerCase()) ||
        (t.message || '').toLowerCase().includes(q.toLowerCase())
    )

    return (
        <Layout title="Dəstək">
            <div className="card" style={{ height: 'calc(100vh - 120px)', padding: 0, display: 'flex', overflow: 'hidden' }}>

                {/* Left Sidebar: Ticket List */}
                <div style={{ width: 350, borderRight: '1px solid var(--stroke)', display: 'flex', flexDirection: 'column', background: 'var(--bg0)' }}>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--stroke)' }}>
                        <div className="search" style={{ width: '100%' }}>
                            <Search size={16} />
                            <input
                                placeholder="Müraciət axtar..."
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Yüklənir...</div>}
                        {!loading && filteredTickets.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Müraciət tapılmadı</div>}

                        {filteredTickets.map(t => (
                            <div
                                key={t.id}
                                onClick={() => selectTicket(t)}
                                style={{
                                    padding: 16,
                                    borderBottom: '1px solid var(--stroke)',
                                    cursor: 'pointer',
                                    background: selectedTicket?.id === t.id ? 'rgba(255,255,255,0.8)' : 'transparent',
                                    borderLeft: selectedTicket?.id === t.id ? '3px solid var(--a1)' : '3px solid transparent'
                                }}
                            >
                                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div className={`pill ${t.status === 'open' ? 'good' : t.status === 'replied' ? 'warn' : ''}`} style={{ fontSize: 10, padding: '2px 8px', height: 'auto' }}>
                                        {t.status.toUpperCase()}
                                    </div>
                                    <div className="muted" style={{ fontSize: 11 }}>{new Date(t.created_at).toLocaleDateString()}</div>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {t.subject}
                                </div>
                                <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {t.message}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Chat Window */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                    {selectedTicket ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: 16, borderBottom: '1px solid var(--stroke)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedTicket.subject}</div>
                                    <div className="row" style={{ marginTop: 4, gap: 12 }}>
                                        <div className="row" style={{ gap: 6 }}>
                                            <User size={14} className="muted" />
                                            <span className="muted" style={{ fontSize: 12 }}>
                                                {selectedTicket.profiles?.full_name || 'İstifadəçi'} • {selectedTicket.profiles?.phone || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`pill ${selectedTicket.status === 'open' ? 'good' : 'warn'}`}>
                                    {selectedTicket.status}
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg0)' }}>
                                {/* Original Ticket */}
                                <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                                    <div style={{ background: '#fff', padding: 16, borderRadius: '16px 16px 16px 4px', border: '1px solid var(--stroke)', boxShadow: 'var(--shadow2)' }}>
                                        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{selectedTicket.message}</div>
                                    </div>
                                    <div className="muted" style={{ fontSize: 11, marginTop: 4, marginLeft: 4 }}>
                                        {new Date(selectedTicket.created_at).toLocaleString()}
                                    </div>
                                </div>

                                {/* Replies */}
                                {selectedTicket.support_messages?.map(m => (
                                    <div key={m.id} style={{ alignSelf: m.is_admin ? 'flex-end' : 'flex-start', maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: m.is_admin ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            background: m.is_admin ? 'var(--a1)' : '#fff',
                                            color: m.is_admin ? '#fff' : 'var(--text)',
                                            padding: 12,
                                            borderRadius: m.is_admin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            border: m.is_admin ? 'none' : '1px solid var(--stroke)',
                                            boxShadow: 'var(--shadow2)'
                                        }}>
                                            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.message}</div>
                                        </div>
                                        <div className="muted" style={{ fontSize: 11, marginTop: 4, margin: '4px 4px 0 4px' }}>
                                            {new Date(m.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div style={{ padding: 16, borderTop: '1px solid var(--stroke)', background: '#fff' }}>
                                <div className="row">
                                    <input
                                        className="input"
                                        placeholder="Cavabınızı yazın..."
                                        style={{ flex: 1 }}
                                        value={replyMsg}
                                        onChange={e => setReplyMsg(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') sendReply() }}
                                    />
                                    <button className="btn primary" onClick={sendReply} disabled={replying || !replyMsg}>
                                        <Send size={18} />
                                        Göndər
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <div>Müraciət seçin</div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
