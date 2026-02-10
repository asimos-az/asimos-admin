import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import { Link } from 'react-router-dom'

export default function SupportPage() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [replyMsg, setReplyMsg] = useState('')
    const [replying, setReplying] = useState(false)

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
            alert('Cavab göndərildi')
        } catch (e) {
            alert(e.message)
        } finally {
            setReplying(false)
        }
    }

    return (
        <Layout>
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
                {/* Left: List */}
                <div className="w-full md:w-1/3 bg-white shadow rounded-lg flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-bold">Müraciətlər</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading && <p className="p-4 text-gray-500">Yüklənir...</p>}
                        {!loading && tickets.length === 0 && (
                            <p className="p-4 text-gray-500">Müraciət yoxdur.</p>
                        )}
                        {tickets.map(t => (
                            <div
                                key={t.id}
                                onClick={() => selectTicket(t)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedTicket?.id === t.id ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className={`px-2 py-0.5 text-xs rounded ${t.status === 'open' ? 'bg-green-100 text-green-800' :
                                            t.status === 'replied' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {t.status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-semibold text-gray-900 truncate">{t.subject}</h3>
                                <p className="text-sm text-gray-600 truncate">{t.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{t.profiles?.full_name || 'İstifadəçi'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Chat */}
                <div className="flex-1 bg-white shadow rounded-lg flex flex-col">
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                                <div>
                                    <h2 className="text-lg font-bold">{selectedTicket.subject}</h2>
                                    <p className="text-sm text-gray-600">
                                        {selectedTicket.profiles?.full_name} • {selectedTicket.profiles?.email} • {selectedTicket.profiles?.phone}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="md:hidden">Bağla</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {/* Main ticket message */}
                                <div className="flex justify-start">
                                    <div className="bg-white border rounded-lg p-3 max-w-[80%]">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Replies */}
                                {selectedTicket.support_messages?.map(m => (
                                    <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg p-3 max-w-[80%] ${m.is_admin ? 'bg-blue-600 text-white' : 'bg-white border'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                                            <p className={`text-xs mt-1 ${m.is_admin ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(m.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t bg-white rounded-b-lg">
                                <div className="flex gap-2">
                                    <textarea
                                        className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Cavab yazın..."
                                        value={replyMsg}
                                        onChange={(e) => setReplyMsg(e.target.value)}
                                    />
                                    <button
                                        onClick={sendReply}
                                        disabled={replying || !replyMsg}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 h-fit self-end"
                                    >
                                        {replying ? '...' : 'Göndər'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            Soldan bir müraciət seçin
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
