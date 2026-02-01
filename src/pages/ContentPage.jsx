import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Save, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Using standard CSS classes from styles.css

// You might need to adjust this import based on where your API client/instance is
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
                // If not found, maybe new
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
                setMessage({ type: 'success', text: 'Yadda saxlanıldı!' });
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
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Helper Tabs */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSlug('terms')}
                        className={`tabBtn ${slug === 'terms' ? 'active' : ''}`}
                    >
                        <FileText size={16} />
                        Qaydalar və Şərtlər
                    </button>
                    {/* Add more tabs here if needed */}
                </div>

                {message && (
                    <div className={`pill ${message.type === 'success' ? 'good' : 'bad'}`} style={{ alignSelf: 'flex-start', fontSize: 14, padding: '10px 16px', borderRadius: 16 }}>
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {message.text}
                    </div>
                )}

                {/* content card */}
                <div className="card">
                    <div className="formRow">
                        <label className="label">SƏHİFƏ BAŞLIĞI</label>
                        <input
                            className="input"
                            placeholder="Qaydaların başlığı..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{ fontSize: 18, fontWeight: 700 }}
                        />
                    </div>

                    <div style={{ height: 24 }} />

                    <div className="formRow">
                        <label className="label">MƏZMUN (RICH TEXT)</label>
                        {loading ? (
                            <div style={{ height: 300, display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'rgba(255,255,255,0.5)', borderRadius: 20, border: '1px solid var(--stroke)' }}>
                                <Loader2 className="animate-spin" size={32} />
                            </div>
                        ) : (
                            <ReactQuill
                                theme="snow"
                                value={body}
                                onChange={setBody}
                                modules={modules}
                                formats={formats}
                                placeholder="Mətni buraya daxil edin..."
                            />
                        )}
                        <p className="label" style={{ marginTop: 6 }}>
                            Mətni qalın, kursiv və ya siyahı şəklində formatlaya bilərsiniz. Mobil tətbiqdə eyni formatda görünəcək.
                        </p>
                    </div>

                    <div style={{ height: 32 }} />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--stroke)', margin: '0 -16px -16px -16px', padding: 16, background: 'rgba(255,255,255,0.3)' }}>
                        <button
                            className="btn primary"
                            onClick={save}
                            disabled={saveLoading || loading}
                            style={{ padding: '12px 24px', fontSize: 15, fontWeight: 700 }}
                        >
                            {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {saveLoading ? 'Saxlanılır...' : 'Yadda saxla'}
                        </button>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
