import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Save, AlertCircle } from 'lucide-react';

// You might need to adjust this import based on where your API client/instance is
// Assuming standard fetch or axios in App context, but here I'll use fetch with the token from localStorage
const API_URL = "https://asimos-backend.onrender.com"; // Adjust if needed

export default function ContentPage() {
    const [slug, setSlug] = useState('terms');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token'); // Assuming JWT is stored here
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
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Xəta baş verdi' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout title="Məzmun İdarəetməsi">
            <div className="space-y-6">

                {/* Slug Selector (Expandable for privacy later) */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setSlug('terms')}
                        className={`px-4 py-2 rounded-lg font-bold ${slug === 'terms' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Qaydalar və Şərtlər
                    </button>

                    {/* Add more pages here if needed */}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <AlertCircle size={20} />
                        {message.text}
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Başlıq</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Səhifə başlığı..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Məzmun</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-96 font-mono text-sm"
                            placeholder="Mətn daxil edin (Markdown dəstəklənir)..."
                        />
                        <p className="text-xs text-gray-400 mt-2">Sadə mətn daxil edin. Paraqraflar üçün boş sətir buraxın.</p>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={save}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
