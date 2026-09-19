import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Plus, Save, Trash2, ArrowLeft, Search, ExternalLink } from 'lucide-react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './CareerArticlesPage.css';

const blank = () => ({ title: '', slug: '', excerpt: '', category: 'Karyera', author: 'Asimos redaksiyası', body: '', cover_url: '', cover_style: 'mint', status: 'draft', featured: false });
const siteUrl = (import.meta.env.VITE_WEB_URL || 'https://asimos.az').replace(/\/+$/, '');
const errorText = error => error.response?.data?.error || 'Əməliyyat alınmadı. Yenidən yoxlayın.';

function BodyPreview({ body }) {
  return body.replace(/\r\n/g, '\n').split(/\n\s*\n/).filter(Boolean).map((part, index) => {
    if (/^##?\s/.test(part)) return <h2 key={index}>{part.replace(/^##?\s+/, '')}</h2>;
    if (part.split('\n').every(line => /^[-*]\s/.test(line))) return <ul key={index}>{part.split('\n').map((line, i) => <li key={i}>{line.replace(/^[-*]\s+/, '')}</li>)}</ul>;
    if (part.startsWith('> ')) return <blockquote key={index}>{part.replace(/^>\s?/gm, '')}</blockquote>;
    return <p key={index}>{part}</p>;
  });
}

export default function CareerArticlesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saveError, setSaveError] = useState('');
  const bodyRef = useRef(null);
  const openRequest = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api.get('/admin/career-articles', { params: { page, limit: 12, q: search, status: filter }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) { setItems(data.items); setTotal(data.total); } })
      .catch(err => { if (!controller.signal.aborted) setError(errorText(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, search, filter, version]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    const guard = event => {
      const link = event.target.closest('a[href]');
      if (link && link.target !== '_blank' && !window.confirm('Saxlanılmamış dəyişikliklər var. Səhifədən çıxmaq istəyirsiniz?')) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    document.addEventListener('click', guard, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', guard, true); };
  }, [dirty]);

  const canLeave = () => !dirty || window.confirm('Saxlanılmamış dəyişikliklər silinsin?');
  const change = (field, value) => { setEditor(previous => ({ ...previous, [field]: value })); setDirty(true); setSaveError(''); };
  const create = () => { if (!canLeave()) return; openRequest.current++; setOpening(false); setEditor(blank()); setDirty(false); setPreview(false); setSaveError(''); };
  const close = () => { if (!canLeave()) return; openRequest.current++; setEditor(null); setDirty(false); setSaveError(''); };
  async function open(article) {
    if (!canLeave()) return;
    const request = ++openRequest.current;
    setOpening(true);
    try {
      const { data } = await api.get(`/admin/career-articles/${article.id}`);
      if (openRequest.current !== request) return;
      setEditor(data); setDirty(false); setPreview(false); setSaveError('');
    } catch (err) { if (openRequest.current === request) toast.error(errorText(err)); }
    finally { if (openRequest.current === request) setOpening(false); }
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setSaveError('');
    try {
      const { data } = editor.id ? await api.put(`/admin/career-articles/${editor.id}`, editor) : await api.post('/admin/career-articles', editor);
      setEditor(data); setDirty(false); setVersion(value => value + 1);
      toast.success(data.status === 'published' ? 'Məqalə yayımlandı.' : 'Qaralama saxlanıldı.');
    } catch (err) { setSaveError(errorText(err)); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!window.confirm(`“${editor.title}” məqaləsi həmişəlik silinsin?`)) return;
    setSaving(true); setSaveError('');
    try {
      await api.delete(`/admin/career-articles/${editor.id}`);
      setEditor(null); setDirty(false); setPage(1); setVersion(value => value + 1); toast.success('Məqalə silindi.');
    } catch (err) { setSaveError(errorText(err)); }
    finally { setSaving(false); }
  }
  function insert(text) {
    const input = bodyRef.current;
    const start = input?.selectionStart ?? editor.body.length;
    const end = input?.selectionEnd ?? start;
    change('body', `${editor.body.slice(0, start)}${start ? '\n\n' : ''}${text}\n\n${editor.body.slice(end)}`);
    input?.focus();
  }

  return <Layout title="Karyera məsləhətləri" subtitle="Ana səhifədəki kartları və karyera jurnalındakı məqalələri idarə edin.">
    <div className="career-admin">
      {editor ? <form onSubmit={save} className="career-editor"><div className="career-editor-top"><button type="button" className="btn" onClick={close} disabled={saving}><ArrowLeft size={16} /> Məqalələr</button><span className={`career-status ${editor.status}`}>{dirty ? 'Saxlanılmayıb' : editor.status === 'published' ? 'Yayımda' : 'Qaralama'}</span><button className="btn primary" disabled={saving}><Save size={16} />{saving ? 'Saxlanılır…' : 'Yadda saxla'}</button></div>
        {saveError && <div role="alert" className="career-admin-error">{saveError}</div>}
        <fieldset disabled={saving} className="career-editor-fields"><div className="career-editor-main"><div className="career-admin-card">
          <label>Başlıq<input className="input career-title-input" required maxLength={180} value={editor.title} onChange={event => change('title', event.target.value)} placeholder="Oxucunun diqqətini çəkən bir başlıq…" /></label>
          <label>Qısa təsvir<textarea className="input" required maxLength={320} rows={3} value={editor.excerpt} onChange={event => change('excerpt', event.target.value)} placeholder="Kartda görünəcək qısa mətn" /><small>{editor.excerpt.length}/320 simvol</small></label>
          <div className="career-body-heading"><b>Məqalənin mətni</b><button type="button" className="btn" onClick={() => setPreview(value => !value)}><BookOpen size={15} /> {preview ? 'Redaktə et' : 'Önizləmə'}</button></div>
          {preview ? <div className="career-body-preview"><BodyPreview body={editor.body} /></div> : <><div className="career-body-toolbar"><button type="button" onClick={() => insert('## Bölmə başlığı')}>H2 Başlıq</button><button type="button" onClick={() => insert('- Birinci maddə\n- İkinci maddə')}>☷ Siyahı</button><button type="button" onClick={() => insert('> Vacib bir məsləhət')}>“ Sitat</button></div><textarea aria-label="Məqalənin mətni" ref={bodyRef} className="input career-body-input" required maxLength={50000} value={editor.body} onChange={event => change('body', event.target.value)} placeholder="Məqaləni burada yazın. Abzaslar arasında boş sətir qoyun." /></>}
          <small>Bölmə üçün “## Başlıq”, siyahı üçün “- Maddə”, sitat üçün “&gt; Mətn” yazın. Bölmələri boş sətirlə ayırın. Oxuma müddəti avtomatik hesablanır.</small>
        </div></div><aside className="career-editor-side"><div className="career-admin-card"><h2>Yayım ayarları</h2><label>Status<select className="input" value={editor.status} onChange={event => change('status', event.target.value)}><option value="draft">Qaralama — yalnız admində</option><option value="published">Yayımlanmış — hamıya açıq</option></select></label><label className="career-checkbox"><input type="checkbox" checked={editor.featured} onChange={event => change('featured', event.target.checked)} />Seçilmiş məqalə</label><small>Seçilmiş məqalələr əvvəl göstərilir. Ana səhifədə ilk 3 məqalə görünür.</small>
          <label>Kateqoriya<input className="input" list="career-categories" maxLength={60} required value={editor.category} onChange={event => change('category', event.target.value)} /><datalist id="career-categories">{['CV', 'Müsahibə', 'İş axtarışı', 'Karyera', 'Uzaqdan iş', 'İnkişaf'].map(category => <option key={category}>{category}</option>)}</datalist></label>
          <label>Müəllif<input className="input" maxLength={100} value={editor.author} onChange={event => change('author', event.target.value)} /></label>
          <label>Məqalə keçidi<input className="input" maxLength={100} value={editor.slug} onChange={event => change('slug', event.target.value)} placeholder="Başlıqdan avtomatik yaradılır" /><small>Yayımlandıqdan sonra dəyişsəniz, əvvəlki keçid işləməyəcək.</small></label>
          {editor.id && editor.status === 'published' && !dirty && <a className="btn" href={`${siteUrl}/karyera-meslehetleri/${encodeURIComponent(editor.slug)}`} target="_blank" rel="noreferrer">Saytda aç <ExternalLink size={14} /></a>}
        </div><div className="career-admin-card"><h2>Üz qabığı</h2><label>Şəkil keçidi (istəyə bağlı)<input className="input" type="url" pattern="https://.*" maxLength={2048} value={editor.cover_url} onChange={event => change('cover_url', event.target.value)} placeholder="https://…" /><small>Şəkil əlavə edilməsə, seçdiyiniz rəngdə dizayn göstərilir.</small></label><label>Rəng<select className="input" value={editor.cover_style} onChange={event => change('cover_style', event.target.value)}><option value="mint">Adaçayı yaşıl</option><option value="peach">İsti şaftalı</option><option value="blue">Dumanlı mavi</option><option value="lilac">Yumşaq bənövşəyi</option></select></label><div className={`career-cover-preview ${editor.cover_style}`} style={editor.cover_url && /^https:\/\//i.test(editor.cover_url) ? { backgroundImage: `url(${JSON.stringify(editor.cover_url)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><span>{editor.category}</span><b>a↗</b></div></div>
          {editor.id && <button type="button" className="btn danger" disabled={saving} onClick={remove}><Trash2 size={16} /> Məqaləni sil</button>}
        </aside></fieldset>
      </form> : <><div className="career-admin-toolbar"><form className="career-admin-search" onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setPage(1); }}><input className="input" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} placeholder="Məqalə axtar…" aria-label="Məqalə axtar" /><button className="btn" aria-label="Axtar"><Search size={18} /></button></form><select className="input" aria-label="Yayım statusu" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="">Bütün statuslar</option><option value="published">Yayımlanmış</option><option value="draft">Qaralama</option></select><button className="btn primary" onClick={create}><Plus size={18} /> Yeni məqalə</button></div>
        {error ? <div role="alert" className="career-admin-error">{error} <button className="btn" onClick={() => setVersion(value => value + 1)}>Yenidən yoxla</button></div> : loading ? <div className="career-admin-empty" role="status">Məqalələr yüklənir…</div> : !items.length ? <div className="career-admin-empty"><BookOpen size={36} /><h2>Məqalə tapılmadı</h2><p>Yeni məqalə yaradın və ya axtarış filtrini dəyişin.</p><button className="btn primary" onClick={create}>İlk məqaləni yaradın</button></div> : <div className="career-admin-grid">{items.map(article => <article key={article.id} className="career-admin-list-card"><div className={`career-cover-preview ${article.cover_style}`}><span>{article.category}</span><b>a↗</b></div><div className="career-list-content"><div className="career-list-meta"><span className={`career-status ${article.status}`}>{article.status === 'published' ? 'Yayımda' : 'Qaralama'}</span>{article.featured && <span>★ Seçilmiş</span>}</div><h2>{article.title}</h2><p>{article.excerpt}</p><div className="career-list-footer"><span>{article.reading_minutes} dəq oxu</span><button className="btn" disabled={opening} onClick={() => open(article)}>Redaktə et →</button></div></div></article>)}</div>}
        {!error && total > 12 && <nav className="career-admin-pagination" aria-label="Məqalə səhifələri"><button className="btn" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>← Əvvəlki</button><span>{page} / {Math.ceil(total / 12)}</span><button className="btn" disabled={page * 12 >= total || loading} onClick={() => setPage(value => value + 1)}>Növbəti →</button></nav>}
      </>}
    </div>
  </Layout>;
}
