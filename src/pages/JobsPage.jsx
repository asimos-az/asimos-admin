import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'
import AdminMapPicker from '../components/AdminMapPicker.jsx'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const formatRadius = (m) => {
  const num = Number(m);
  if (!num || isNaN(num) || num <= 0) return "";
  if (num >= 1000) {
    const km = num / 1000;
    return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
  }
  return `${num} m`;
};

const jobStatusTabs = [
  ['all', 'Hamısı'],
  ['open', 'Aktiv'],
  ['pending', 'Gözləyir'],
  ['draft', 'Qaralama'],
  ['closed', 'Deaktiv'],
  ['rejected', 'Rədd'],
  ['deleted', 'Silinmiş'],
];

function statusPill(job) {
  const status = String(job?.status || 'open').toLowerCase();
  if (status === 'pending') return <span className="pill warn">Gözləyir</span>;
  if (status === 'draft') return <span className="pill info">Qaralama</span>;
  if (status === 'closed' || status === 'inactive') return <span className="pill">Deaktiv</span>;
  if (status === 'rejected') return <span className="pill bad">Rədd</span>;
  if (status === 'deleted') return <span className="pill bad">Silinmiş</span>;
  if (job?.published_at && new Date(job.published_at) > new Date()) return <span className="pill info">Planlaşdırılıb</span>;
  return <span className="pill good">Aktiv</span>;
}

export default function JobsPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    created_by: '',
    title: '',
    category: '',
    wage: '',
    whatsapp: '',
    contact_phone: '+994',
    contact_link: '',
    description: '',
    is_daily: false,
    notify_radius_m: 500,
    location_lat: '',
    location_lng: '',
    location_address: '',
    company_name: '',
    duration_days: '',
    starts_at: '',
    working_hours: '',
    published_at: '',
    image_url: '',
  })
  const [employers, setEmployers] = useState([])
  const [employersLoading, setEmployersLoading] = useState(false)
  const [employersError, setEmployersError] = useState('')
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)

  const applyEmployerToCreateForm = (employerId) => {
    const employer = (employers || []).find((item) => String(item.id) === String(employerId))
    setCreateForm((prev) => ({
      ...prev,
      created_by: employerId,
      company_name: employer?.company_name || employer?.companyName || prev.company_name || '',
      image_url: employer?.logo_url || employer?.logoUrl || employer?.profileLogoUrl || prev.image_url || '',
      whatsapp: employer?.phone || prev.whatsapp || '+994',
      contact_phone: employer?.phone || prev.contact_phone || '+994',
    }))
  }

  const [creatingEmployer, setCreatingEmployer] = useState(false)
  const [employerForm, setEmployerForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
  })

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.get('/admin/jobs', { params: { q, status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 } })
      setItems(data?.items || [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  useEffect(() => {
    // preload meta for create form
    loadMeta()
  }, [])

  const openCreate = () => {
    setCreateForm({
      created_by: '',
      title: '',
      category: '',
      wage: '',
      whatsapp: '+994',
      contact_phone: '+994',
      contact_link: '',
      description: '',
      is_daily: false,
      notify_radius_m: 500,
      location_lat: '',
      location_lng: '',
      location_address: '',
      company_name: '',
      duration_days: '1',
      starts_at: new Date().toISOString().split('T')[0],
      working_hours: '',
      published_at: '',
      image_url: '',
    })
    setCreating(true)
  }

  const createJob = async () => {
    if (!createForm.title.trim()) return toast.error('Başlıq boş ola bilməz')
    if (!createForm.created_by) return toast.error('Elanı hansı işçi axtaran (employer) adına yaratmaq lazımdır?')
    if (!createForm.location_lat || !createForm.location_lng) return toast.error('Lokasiya seçilməlidir (xəritədən seçin)')
    setSaving(true)
    try {
      const payload = {
        created_by: createForm.created_by,
        title: createForm.title,
        category: createForm.category || null,
        wage: createForm.wage || null,

        whatsapp: createForm.whatsapp || null,
        contact_phone: createForm.contact_phone || null,
        contact_link: createForm.contact_link || null,
        description: createForm.description || '',
        is_daily: !!createForm.is_daily,
        notify_radius_m: createForm.notify_radius_m ? Number(createForm.notify_radius_m) : null,
        location_lat: createForm.location_lat ? Number(createForm.location_lat) : null,
        location_lng: createForm.location_lng ? Number(createForm.location_lng) : null,
        location_address: createForm.location_address || null,
        company_name: createForm.company_name || null,
        duration_days: createForm.duration_days ? Number(createForm.duration_days) : null,
        starts_at: createForm.starts_at || null,
        working_hours: createForm.working_hours || null,
        published_at: createForm.published_at || null,
        image_url: createForm.image_url || null,
        status: 'open',
      }
      await api.post('/admin/jobs', payload)
      toast.success('Elan yaradıldı')
      setCreating(false)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Elan yaratmaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const loadMeta = async () => {
    setEmployersLoading(true)
    setEmployersError('')
    try {
      const [uRes, cRes] = await Promise.all([
        api.get('/admin/employers'),
        api.get('/categories'),
      ])
      const list = uRes?.data?.items || []
      setEmployers(list)
      setCategories((cRes?.data?.items || []).map((x) => x.name))
      if (!list.length) setEmployersError('DB-də işçi axtaran hesab tapılmadı. İstifadəçi rolunu yoxlayın və ya + Employer ilə yeni hesab yaradın.')
    } catch (e) {
      setEmployersError(e?.response?.data?.error || e.message || 'Employer siyahısı yüklənmədi')
    } finally {
      setEmployersLoading(false)
    }
  }

  const openCreateEmployer = () => {
    setEmployerForm({ full_name: '', email: '', phone: '', password: '', companyName: '' })
    setCreatingEmployer(true)
  }

  const createEmployer = async () => {
    try {
      if (!employerForm.full_name || !employerForm.email || !employerForm.password) {
        toast.error('Ad, Email və Şifrə mütləqdir')
        return
      }
      // Use the same register endpoint as mobile (role=employer)
      const payload = {
        role: 'employer',
        full_name: employerForm.full_name,
        email: employerForm.email,
        phone: employerForm.phone || null,
        password: employerForm.password,
        companyName: employerForm.companyName || null,
      }
      const res = await api.post('/auth/register', payload)
      const newId = res?.data?.profile?.id
      await loadMeta()
      if (newId) {
        setCreateForm((p) => ({ ...p, created_by: newId }))
      }
      toast.success('Employer yaradıldı')
      setCreatingEmployer(false)
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Employer yaratmaq alınmadı')
    }
  }

  const openEdit = (j) => {
    setSelected({
      ...j,
      status: j.status || 'open',
      title: j.title || '',
      category: j.category || '',
      wage: j.wage || '',
      whatsapp: j.whatsapp || '',
      contact_phone: j.contact_phone || '+994',
      contact_link: j.contact_link || '',
      description: j.description || '',
      location_lat: j.location_lat || '',
      location_lng: j.location_lng || '',
      notify_radius_m: j.notify_radius_m || '',
      location_address: j.location_address || '',
      company_name: j.company_name || '',
      duration_days: j.duration_days || '',
      starts_at: j.starts_at ? new Date(j.starts_at).toISOString().split('T')[0] : '',
      working_hours: j.working_hours || '',
      published_at: j.published_at ? new Date(j.published_at).toISOString().slice(0, 16) : '',
      image_url: j.image_url || j.imageUrl || '',
    })
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const patch = {
        status: selected.status,
        title: selected.title,
        category: selected.category || null,
        wage: selected.wage || null,
        whatsapp: selected.whatsapp || null,
        contact_phone: selected.contact_phone || null,
        contact_link: selected.contact_link || null,
        description: selected.description || '',
        is_daily: !!selected.is_daily,
        notify_radius_m: selected.notify_radius_m ? Number(selected.notify_radius_m) : null,
        location_lat: selected.location_lat ? Number(selected.location_lat) : null,
        location_lng: selected.location_lng ? Number(selected.location_lng) : null,
        location_address: selected.location_address || null,
        company_name: selected.company_name || null,
        duration_days: selected.duration_days ? Number(selected.duration_days) : null,
        starts_at: selected.starts_at || null,
        working_hours: selected.working_hours || null,
        published_at: selected.published_at || null,
        image_url: selected.image_url || null,
      }
      await api.patch(`/admin/jobs/${selected.id}`, patch)
      toast.success('Elan yeniləndi')
      setSelected(null)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Yadda saxlamaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const del = async (jobId) => {
    if (!confirm('Bu elanı silinmiş elanlara göndərmək istəyirsiniz?')) return
    try {
      await api.delete(`/admin/jobs/${jobId}`)
      toast.success('Elan silinmiş elanlara göndərildi')
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Silmək alınmadı')
    }
  }

  /* Existing code before this point */
  const reject = async (id) => {
    const reason = prompt('Rədd səbəbini yazın')
    if (!reason) return
    setSaving(true)
    try {
      await api.patch(`/admin/jobs/${id}`, { status: 'rejected', rejection_reason: reason })
      toast.success('Elan rədd edildi')
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Xəta baş verdi')
    } finally {
      setSaving(false)
    }
  }

  const approve = async (id) => {
    if (!confirm('Elanı təsdiqləmək istəyirsiniz?')) return
    setSaving(true)
    try {
      await api.patch(`/admin/jobs/${id}`, { status: 'open' })
      toast.success('Elan təsdiqləndi')
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Xəta baş verdi')
    } finally {
      setSaving(false)
    }
  }

  // NOTE: openCreate/createJob are defined earlier in this file.

  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <Layout title="Elanlar">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <input className="input" placeholder="Başlıq/kateqoriya/təsvir axtar" value={q} onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }} style={{ width: 340 }} />
            <button className="btn" onClick={() => { setCurrentPage(1); load(); }} disabled={loading}>Axtar</button>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" onClick={openCreate}>+ Yeni elan</button>
            <div className="muted">Göstərilir: {items.length}</div>
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {jobStatusTabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`btn ${statusFilter === value ? 'good' : 'ghost'}`}
              onClick={() => { setStatusFilter(value); setCurrentPage(1); }}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <div className="pill bad" style={{ marginTop: 12 }}>{error}</div> : null}

        <div className="tableWrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Başlıq</th>
                <th>Kateqoriya</th>
                <th>Maaş</th>
                <th>Şirkət</th>
                <th>Yaradan</th>
                <th>Rəylər</th>
                <th>Favorit</th>
                <th>Tarix</th>
                <th style={{ width: 300 }}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((j) => (
                <tr key={j.id}>
                  <td>
{statusPill(j)}
                  </td>
                  <td style={{ fontWeight: 700 }}>{j.title}</td>
                  <td className="muted">{j.category || '-'}</td>
                  <td className="muted">{j.wage || '-'}</td>
                  <td className="muted">{j.company_name || '-'}</td>
                  <td className="muted">{j.profiles?.full_name || j.created_by || '-'}</td>
                  <td>
                    {j.ratings?.[0]?.count > 0 ? (
                      <span className="pill bad" style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.id}`)}>
                        {j.ratings[0].count} rəy
                      </span>
                    ) : '-'}
                  </td>
                  <td><span className="pill info">{j.favorite_count || 0}</span></td>
                  <td className="muted">{new Date(j.created_at).toLocaleString('az-AZ')}</td>
                  <td>
                    <div className="row">
                      {j.status === 'pending' && (
                        <>
                          <button className="btn good" onClick={() => approve(j.id)} disabled={saving}>Təsdiq</button>
                          <button className="btn danger" onClick={() => reject(j.id)} disabled={saving}>Rədd et</button>
                        </>
                      )}
                      <button className="btn" onClick={() => navigate(`/jobs/${j.id}`)}>Ətraflı</button>
                      <button className="btn ghost" onClick={() => openEdit(j)}>Düzəliş</button>
                      <button className="btn danger" onClick={() => del(j.id)}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading ? <tr><td colSpan="10" className="muted">Yüklənir…</td></tr> : null}
              {!loading && items.length === 0 ? <tr><td colSpan="10" className="muted">Elan tapılmadı.</td></tr> : null}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalItems={items.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        open={!!selected}
        title="Elanı redaktə et"
        onClose={() => setSelected(null)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setSelected(null)} disabled={saving}>Ləğv et</button>
            <button className="btn" onClick={save} disabled={saving}>{saving ? 'Yadda saxlanır…' : 'Yadda saxla'}</button>
          </>
        }
      >
        <div className="formGrid">
          <div className="formRow">
            <div className="label">Elan ID</div>
            <div className="mono">{selected?.id}</div>
          </div>
          <div className="formRow">
            <div className="label">Yaradan</div>
            <div className="muted">{selected?.profiles?.full_name || selected?.created_by || '-'}</div>
          </div>

          <div className="formRow">
            <div className="label">Status</div>
            <select className="select" value={selected?.status || 'open'} onChange={(e) => setSelected({ ...selected, status: e.target.value })}>
              <option value="open">Aktiv (Open)</option>
              <option value="pending">Gözləyir (Pending)</option>
              <option value="draft">Qaralama (Draft)</option>
              <option value="closed">Deaktiv (Closed)</option>
              <option value="rejected">Rədd (Rejected)</option>
              <option value="deleted">Silinmiş (Deleted)</option>
            </select>
          </div>

          <div className="formRow">
            <div className="label">Başlıq</div>
            <input className="input" value={selected?.title || ''} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Kateqoriya</div>
            <select className="select" value={selected?.category || ''} onChange={(e) => setSelected({ ...selected, category: e.target.value })}>
              <option value="">Seçin…</option>
              {(categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="formRow">
            <div className="label">Şirkət adı</div>
            <input className="input" value={selected?.company_name || ''} onChange={(e) => setSelected({ ...selected, company_name: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Loqo / şəkil URL</div>
            <input className="input" value={selected?.image_url || ''} onChange={(e) => setSelected({ ...selected, image_url: e.target.value })} placeholder="https://..." />
            {selected?.image_url ? <img src={selected.image_url} alt="" style={{ width: 54, height: 54, objectFit: 'contain', marginTop: 8, borderRadius: 12, border: '1px solid #e5e7eb' }} /> : null}
          </div>

          <div className="formRow">
            <div className="label">İş növü</div>
            <select className="select" value={selected?.is_daily ? 'true' : 'false'} onChange={(e) => { const nextIsDaily = e.target.value === 'true'; setSelected({ ...selected, is_daily: nextIsDaily, job_type: nextIsDaily ? 'temporary' : 'permanent', duration_days: nextIsDaily ? (selected?.duration_days || 1) : '', starts_at: nextIsDaily ? selected?.starts_at : '' }); }}>
              <option value="false">Daimi iş</option>
              <option value="true">Günəmuzd</option>
            </select>
          </div>

          {selected?.is_daily && (
            <>
              <div className="formRow">
                <div className="label">Gün sayı</div>
                <input className="input" type="number" value={selected?.duration_days || ''} onChange={(e) => setSelected({ ...selected, duration_days: e.target.value })} />
              </div>
              <div className="formRow">
                <div className="label">Başlama tarixi</div>
                <input className="input" type="date" value={selected?.starts_at || ''} onChange={(e) => setSelected({ ...selected, starts_at: e.target.value })} />
              </div>
              <div className="formRow">
                <div className="label">İş saatları</div>
                <input className="input" placeholder="məs: 09:00 - 18:00" value={selected?.working_hours || ''} onChange={(e) => setSelected({ ...selected, working_hours: e.target.value })} />
              </div>
            </>
          )}

          <div className="formRow">
            <div className="label">Bildiriş radiusu (m) {selected?.notify_radius_m ? <span className="pill good" style={{ marginLeft: 8, padding: '2px 8px' }}>{formatRadius(selected.notify_radius_m)}</span> : null}</div>
            <input className="input" type="number" value={selected?.notify_radius_m || ''} onChange={(e) => setSelected({ ...selected, notify_radius_m: e.target.value })} />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Daxil edilən rəqəm metr ilə hesablanır (məs: 500 = 500 metr, 1500 = 1.5 km).</div>
          </div>
          <div className="formRow">
            <div className="label">Paylaşılma Tarixi (Boşdursa indi)</div>
            <input className="input" type="datetime-local" value={selected?.published_at || ''} onChange={(e) => setSelected({ ...selected, published_at: e.target.value })} />
          </div>

          <div className="formRow">
            <div className="label">Maaş</div>
            <input className="input" value={selected?.wage || ''} onChange={(e) => setSelected({ ...selected, wage: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">WhatsApp</div>
            <input className="input" value={selected?.whatsapp || ''} onChange={(e) => setSelected({ ...selected, whatsapp: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Əlaqə Nömrəsi</div>
            <input className="input" value={selected?.contact_phone || ''} onChange={(e) => setSelected({ ...selected, contact_phone: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Link</div>
            <input className="input" value={selected?.contact_link || ''} onChange={(e) => setSelected({ ...selected, contact_link: e.target.value })} />
          </div>

          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Lokasiya (xəritədən seç)</div>
            <AdminMapPicker
              lat={selected?.location_lat ? Number(selected.location_lat) : null}
              lng={selected?.location_lng ? Number(selected.location_lng) : null}
              onChange={({ lat, lng, address }) => setSelected((p) => ({
                ...p,
                location_lat: String(lat),
                location_lng: String(lng),
                location_address: (p.location_address || '').trim() ? p.location_address : (address || ''),
              }))}
            />
          </div>

          <div className="formRow">
            <div className="label">Lokasiya lat</div>
            <input className="input" value={selected?.location_lat || ''} onChange={(e) => setSelected({ ...selected, location_lat: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Lokasiya lng</div>
            <input className="input" value={selected?.location_lng || ''} onChange={(e) => setSelected({ ...selected, location_lng: e.target.value })} />
          </div>

          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Lokasiya ünvanı</div>
            <input className="input" value={selected?.location_address || ''} onChange={(e) => setSelected({ ...selected, location_address: e.target.value })} />
          </div>
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Təsvir</div>
            <textarea className="input" rows={5} value={selected?.description || ''} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={creating}
        title="Yeni elan yarat (Admin)"
        onClose={() => setCreating(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setCreating(false)} disabled={saving}>Ləğv et</button>
            <button className="btn" onClick={createJob} disabled={saving}>{saving ? 'Yaradılır…' : 'Yarat'}</button>
          </>
        }
      >
        <div className="formGrid">
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Employer (elan sahibi)</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select className="select" value={createForm.created_by} onChange={(e) => applyEmployerToCreateForm(e.target.value)} style={{ flex: 1 }} disabled={employersLoading}>
                <option value="">{employersLoading ? 'Yüklənir…' : 'Seçin…'}</option>
                {(employers || []).map((u) => (
                  <option key={u.id} value={u.id}>{[u.full_name || u.company_name || u.phone || 'Employer', u.email, u.role, u.logo_url ? 'logo var' : null].filter(Boolean).join(' • ')}</option>
                ))}
              </select>
              <button className="btn ghost" type="button" onClick={openCreateEmployer}>+ Employer</button>
            </div>
            {employersError ? <div className="alert error" style={{ marginTop: 8 }}>{employersError}</div> : null}
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Qeyd: Admin elanı mütləq bir işçi axtaran / employer hesabına bağlamalıdır. Siyahıda {employers.length} hesab var.</div>
          </div>

          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Başlıq</div>
            <input className="input" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
          </div>

          <div className="formRow">
            <div className="label">Kateqoriya</div>
            <select className="select" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}>
              <option value="">Seçin…</option>
              {(categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="formRow">
            <div className="label">Şirkət adı</div>
            <input className="input" value={createForm.company_name} onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Loqo / şəkil URL</div>
            <input className="input" value={createForm.image_url} onChange={(e) => setCreateForm({ ...createForm, image_url: e.target.value })} placeholder="https://..." />
            {createForm.image_url ? <img src={createForm.image_url} alt="" style={{ width: 54, height: 54, objectFit: 'contain', marginTop: 8, borderRadius: 12, border: '1px solid #e5e7eb' }} /> : null}
          </div>
          <div className="formRow">
            <div className="label">Maaş</div>
            <input className="input" value={createForm.wage} onChange={(e) => setCreateForm({ ...createForm, wage: e.target.value })} />
          </div>

          <div className="formRow">
            <div className="label">WhatsApp</div>
            <input className="input" value={createForm.whatsapp} onChange={(e) => setCreateForm({ ...createForm, whatsapp: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Əlaqə Nömrəsi</div>
            <input className="input" value={createForm.contact_phone} onChange={(e) => setCreateForm({ ...createForm, contact_phone: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Link (Instagram/Web)</div>
            <input className="input" value={createForm.contact_link} onChange={(e) => setCreateForm({ ...createForm, contact_link: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">İş növü</div>
            <select className="select" value={createForm.is_daily ? 'true' : 'false'} onChange={(e) => { const nextIsDaily = e.target.value === 'true'; setCreateForm({ ...createForm, is_daily: nextIsDaily, job_type: nextIsDaily ? 'temporary' : 'permanent', duration_days: nextIsDaily ? (createForm.duration_days || 1) : '', starts_at: nextIsDaily ? createForm.starts_at : '' }); }}>
              <option value="false">Daimi iş</option>
              <option value="true">Günəmuzd</option>
            </select>
          </div>

          {createForm.is_daily && (
            <>
              <div className="formRow">
                <div className="label">Gün sayı</div>
                <input className="input" type="number" value={createForm.duration_days} onChange={(e) => setCreateForm({ ...createForm, duration_days: e.target.value })} />
              </div>
              <div className="formRow">
                <div className="label">Başlama tarixi</div>
                <input className="input" type="date" value={createForm.starts_at} onChange={(e) => setCreateForm({ ...createForm, starts_at: e.target.value })} />
              </div>
              <div className="formRow">
                <div className="label">İş saatları</div>
                <input className="input" placeholder="məs: 09:00 - 18:00" value={createForm.working_hours} onChange={(e) => setCreateForm({ ...createForm, working_hours: e.target.value })} />
              </div>
            </>
          )}

          <div className="formRow">
            <div className="label">Bildiriş radiusu (m) {createForm.notify_radius_m ? <span className="pill good" style={{ marginLeft: 8, padding: '2px 8px' }}>{formatRadius(createForm.notify_radius_m)}</span> : null}</div>
            <input className="input" type="number" value={createForm.notify_radius_m} onChange={(e) => setCreateForm({ ...createForm, notify_radius_m: e.target.value })} />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Daxil edilən rəqəm metr ilə hesablanır (məs: 500 = 500 metr, 1500 = 1.5 km).</div>
          </div>
          <div className="formRow">
            <div className="label">Paylaşılma Tarixi (Boşdursa indi)</div>
            <input className="input" type="datetime-local" value={createForm.published_at} onChange={(e) => setCreateForm({ ...createForm, published_at: e.target.value })} />
          </div>
          <div className="formRow" />

          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Lokasiya (xəritədən seç)</div>
            <AdminMapPicker
              lat={createForm.location_lat ? Number(createForm.location_lat) : null}
              lng={createForm.location_lng ? Number(createForm.location_lng) : null}
              onChange={({ lat, lng, address }) => setCreateForm((p) => ({
                ...p,
                location_lat: String(lat),
                location_lng: String(lng),
                location_address: (p.location_address || '').trim() ? p.location_address : (address || ''),
              }))}
            />
          </div>

          <div className="formRow">
            <div className="label">Lokasiya lat</div>
            <input className="input" value={createForm.location_lat} onChange={(e) => setCreateForm({ ...createForm, location_lat: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Lokasiya lng</div>
            <input className="input" value={createForm.location_lng} onChange={(e) => setCreateForm({ ...createForm, location_lng: e.target.value })} />
          </div>

          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Lokasiya ünvanı</div>
            <input className="input" value={createForm.location_address} onChange={(e) => setCreateForm({ ...createForm, location_address: e.target.value })} />
          </div>

          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Təsvir</div>
            <textarea className="input" rows={6} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={creatingEmployer}
        title="Yeni employer yarat"
        onClose={() => setCreatingEmployer(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setCreatingEmployer(false)}>Ləğv et</button>
            <button className="btn" onClick={createEmployer}>Yarat</button>
          </>
        }
      >
        <div className="formGrid">
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Ad / Soyad</div>
            <input className="input" value={employerForm.full_name} onChange={(e) => setEmployerForm((p) => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="formRow">
            <div className="label">Email</div>
            <input className="input" value={employerForm.email} onChange={(e) => setEmployerForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="formRow">
            <div className="label">Telefon</div>
            <input className="input" value={employerForm.phone} onChange={(e) => setEmployerForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Şirkət adı</div>
            <input className="input" value={employerForm.companyName} onChange={(e) => setEmployerForm((p) => ({ ...p, companyName: e.target.value }))} />
          </div>
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Şifrə</div>
            <input className="input" type="password" value={employerForm.password} onChange={(e) => setEmployerForm((p) => ({ ...p, password: e.target.value }))} />
            <div className="muted" style={{ fontSize: 12 }}>Bu employer üçün login şifrəsi.</div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}