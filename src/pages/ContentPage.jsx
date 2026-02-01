import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Save, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// You might need to adjust this import based on where your API client/instance is
// Assuming standard fetch or axios in App context, but here I'll use fetch with the token from localStorage
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
                setMessage({ type: 'success', text: 'Məlumat uğurla yadda saxlanıldı!' });
                setTimeout(() => setMessage(null), 3000);
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
        <Layout title="Məzmun İdarəetməsi" subtitle="Mobil tətbiq üçün statik səhifələri redaktə edin.">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Page Selector Tabs */}
                <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-xl w-fit">
                    <button
                        onClick={() => setSlug('terms')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${slug === 'terms'
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                    >
                        <FileText size={16} />
                        Qaydalar və Şərtlər
                    </button>

                    {/* Future pages can be added here */}
                    {/* <button className="..." disabled>Məxfilik Siyasəti (Tezliklə)</button> */}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                    {/* Header Input */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Səhifə Başlığı
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full text-xl font-bold bg-transparent border-none placeholder-gray-400 focus:outline-none focus:ring-0 p-0 text-gray-900"
                            placeholder="Başlıq daxil edin (məs: Qaydalar və Şərtlər)..."
                        />
                    </div>

                    {/* Editor */}
                    <div className="p-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Məzmun (Rich Text)
                        </label>
                        <div className="prose-editor">
                            <ReactQuill
                                theme="snow"
                                value={body}
                                onChange={setBody}
                                modules={modules}
                                formats={formats}
                                className="h-96 mb-12" // mb-12 to make space for toolbar
                                placeholder="Məzmunu buraya yazın..."
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 p-4 px-6 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={save}
                            disabled={loading}
                            className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 transition-all transform active:scale-95
                ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}
              `}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                            <span>{loading ? 'Yadda saxlanılır...' : 'Yadda saxla'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
