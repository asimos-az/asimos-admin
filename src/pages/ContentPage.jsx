import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Save, AlertCircle, CheckCircle2, FileText, Loader2, Type } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || "https://asimos-backend.onrender.com";

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
];

export default function ContentPage() {
    const [slug, setSlug] = useState('terms');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchContent();
    }, [slug]);

    async function fetchContent() {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/content/${slug}`);
            if (res.ok) {
                const data = await res.json();
                setTitle(data.title || '');
                setBody(data.body || '');
            } else {
                setTitle('');
                setBody('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        setSaveLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/content/${slug}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, body })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Məlumat uğurla yadda saxlanıldı!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Xəta baş verdi' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSaveLoading(false);
        }
    }

    return (
        <Layout title="Məzmun İdarəetməsi" subtitle="Mobil tətbiq üçün statik səhifələri redaktə edin.">
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Top Controls: Tabs & Feedback */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => setSlug('terms')}
                            className={`tabBtn ${slug === 'terms' ? 'active' : ''}`}
                        >
                            <FileText size={16} />
                            Qaydalar və Şərtlər
                        </button>
                        {/* Can add privacy policy tab here later */}
                    </div>

                    {message && (
                        <div className={`pill ${message.type === 'success' ? 'good' : 'bad'}`} style={{ padding: '8px 16px', borderRadius: 99, fontWeight: 500 }}>
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Main Content Card - "Elanlar" Style */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow2)', borderRadius: 'var(--r28)' }}>

                    {/* Header Section inside Card */}
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--stroke)', background: 'linear-gradient(to bottom, #fff, #fafafa)' }}>
                        <label className="label" style={{ marginBottom: 8, display: 'block', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Type size={14} /> SƏHİFƏ BAŞLIĞI
                        </label>
                        <input
                            className="input"
                            placeholder="Başlığı daxil edin (məs: Qaydalar və Şərtlər)..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{
                                fontSize: 24,
                                fontWeight: 800,
                                padding: '12px 16px',
                                border: '1px solid var(--stroke)',
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                width: '100%'
                            }}
                        />
                    </div>

                    {/* Editor Section */}
                    <div style={{ padding: '32px' }}>
                        {loading ? (
                            <div style={{ height: 600, display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'rgba(255,255,255,0.5)', borderRadius: 20, border: '1px solid var(--stroke)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <Loader2 className="animate-spin" size={40} />
                                    <span style={{ fontSize: 14 }}>Məlumat yüklənir...</span>
                                </div>
                            </div>
                        ) : (
                            <ReactQuill
                                theme="snow"
                                value={body}
                                onChange={setBody}
                                modules={modules}
                                formats={formats}
                                placeholder="Məzmunu buraya daxil edin..."
                                style={{ border: 'none' }} // Border handled by wrapper in CSS
                            />
                        )}
                    </div>

                    {/* Footer Action Bar */}
                    <div style={{ padding: '20px 32px', background: '#fafafa', borderTop: '1px solid var(--stroke)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="label">
                            Son yeniləmə: {new Date().toLocaleDateString('az-AZ')}
                        </span>
                        <button
                            className="btn primary"
                            onClick={save}
                            disabled={saveLoading || loading}
                            style={{ padding: '14px 32px', fontSize: 16, fontWeight: 700, borderRadius: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                        >
                            {saveLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {saveLoading ? 'Saxlanılır...' : 'Yadda saxla'}
                        </button>
                    </div>

                </div>

            </div>
        </Layout>
    );
}
