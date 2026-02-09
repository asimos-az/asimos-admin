import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import AdminMapPicker from '../components/AdminMapPicker.jsx'
import { api } from '../lib/api'

export default function JobsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
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
  })
  const [employers, setEmployers] = useState([])
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)

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
      const { data } = await api.get('/admin/jobs', { params: { q, limit: 50 } })
      setItems(data?.items || [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
    })
    setCreating(true)
  }

  const createJob = async () => {
    if (!createForm.title.trim()) return alert('Başlıq boş ola bilməz')
    if (!createForm.created_by) return alert('Elanı hansı işçi axtaran (employer) adına yaratmaq lazımdır?')
    if (!createForm.location_lat || !createForm.location_lng) return alert('Lokasiya seçilməlidir (xəritədən seçin)')
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
        status: 'open',
      }
      await api.post('/admin/jobs', payload)
      setCreating(false)
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Elan yaratmaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const loadMeta = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        api.get('/admin/users', { params: { limit: 500 } }),
        api.get('/categories'),
      ])
      const users = uRes?.data?.items || []
      setEmployers(users.filter((x) => String(x.role || '').toLowerCase() === 'employer'))
      setCategories((cRes?.data?.items || []).map((x) => x.name))
    } catch { }
  }

  const openCreateEmployer = () => {
    setEmployerForm({ full_name: '', email: '', phone: '', password: '', companyName: '' })
    setCreatingEmployer(true)
  }

  const createEmployer = async () => {
    try {
      if (!employerForm.full_name || !employerForm.email || !employerForm.password) {
        alert('Ad, Email və Şifrə mütləqdir')
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
      setCreatingEmployer(false)
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Employer yaratmaq alınmadı')
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
      notify_radius_m: j.notify_radius_m || '',
      location_address: j.location_address || '',
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
        location_address: selected.location_address || null,
      }
      await api.patch(`/admin/jobs/${selected.id}`, patch)
      setSelected(null)
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Yadda saxlamaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const del = async (jobId) => {
    if (!confirm('Bu elanı silmək istəyirsiniz?')) return
    try {
      await api.delete(`/admin/jobs/${jobId}`)
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Silmək alınmadı')
    }
  }

  /* Existing code before this point */
  const approve = async (id) => {
    if (!confirm('Elanı təsdiqləmək istəyirsiniz?')) return
    setSaving(true)
    try {
      await api.patch(`/admin/jobs/${id}`, { status: 'open' })
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Xəta baş verdi')
    } finally {
      setSaving(false)
    }
  }

  // NOTE: openCreate/createJob are defined earlier in this file.

  return (
    <Layout title="Elanlar">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <input className="input" placeholder="Başlıq/kateqoriya/təsvir axtar" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 340 }} />
            <button className="btn" onClick={load} disabled={loading}>Axtar</button>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" onClick={openCreate}>+ Yeni elan</button>
            <div className="muted">Göstərilir: {items.length}</div>
          </div>
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
                <th>Yaradan</th>
                <th>Tarix</th>
                <th style={{ width: 160 }}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((j) => (
                <tr key={j.id}>
                  <td>
                    {j.status === 'pending' ? <span className="pill warn">Gözləyir</span> :
                      j.status === 'closed' ? <span className="pill">Bağlı</span> :
                        <span className="pill good">Aktiv</span>}
                  </td>
                  <td style={{ fontWeight: 700 }}>{j.title}</td>
                  <td className="muted">{j.category || '-'}</td>
                  <td className="muted">{j.wage || '-'}</td>
                  <td className="mono">{j.created_by}</td>
                  <td className="muted">{new Date(j.created_at).toLocaleString('az-AZ')}</td>
                  <td>
                    <div className="row">
                      {j.status === 'pending' && (
                        <button className="btn good" onClick={() => approve(j.id)} disabled={saving}>Təsdiq</button>
                      )}
                      <button className="btn ghost" onClick={() => openEdit(j)}>Düzəliş</button>
                      <button className="btn danger" onClick={() => del(j.id)}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading ? <tr><td colSpan="7" className="muted">Yüklənir…</td></tr> : null}
              {!loading && items.length === 0 ? <tr><td colSpan="7" className="muted">Elan tapılmadı.</td></tr> : null}
            </tbody>
          </table>
        </div>
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
            <div className="mono">{selected?.created_by}</div>
          </div>

          <div className="formRow">
            <div className="label">Status</div>
            <select className="select" value={selected?.status || 'open'} onChange={(e) => setSelected({ ...selected, status: e.target.value })}>
              <option value="open">Aktiv (Open)</option>
              <option value="pending">Gözləyir (Pending)</option>
              <option value="closed">Bağlı (Closed)</option>
            </select>
          </div>

          <div className="formRow">
            <div className="label">Başlıq</div>
            <input className="input" value={selected?.title || ''} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Kateqoriya</div>
            <input className="input" value={selected?.category || ''} onChange={(e) => setSelected({ ...selected, category: e.target.value })} />
          </div>

          <div className="formRow">
            <div className="label">Gündəlik iş?</div>
            <select className="select" value={selected?.is_daily ? 'true' : 'false'} onChange={(e) => setSelected({ ...selected, is_daily: e.target.value === 'true' })}>
              <option value="false">Xeyr</option>
              <option value="true">Bəli</option>
            </select>
          </div>
          <div className="formRow">
            <div className="label">Bildiriş radiusu (m)</div>
            <input className="input" value={selected?.notify_radius_m || ''} onChange={(e) => setSelected({ ...selected, notify_radius_m: e.target.value })} />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Daxil edilən rəqəm metr ilə hesablanır (məs: 500 = 500 metr).</div>
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
              <select className="select" value={createForm.created_by} onChange={(e) => setCreateForm({ ...createForm, created_by: e.target.value })} style={{ flex: 1 }}>
                <option value="">Seçin…</option>
                {(employers || []).map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email || u.id}</option>
                ))}
              </select>
              <button className="btn ghost" type="button" onClick={openCreateEmployer}>+ Employer</button>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Qeyd: Admin elanı mütləq bir employer hesabına bağlamalıdır.</div>
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
            <div className="label">Gündəlik iş?</div>
            <select className="select" value={createForm.is_daily ? 'true' : 'false'} onChange={(e) => setCreateForm({ ...createForm, is_daily: e.target.value === 'true' })}>
              <option value="false">Xeyr</option>
              <option value="true">Bəli</option>
            </select>
          </div>

          <div className="formRow">
            <div className="label">Bildiriş radiusu (m)</div>
            <input className="input" value={createForm.notify_radius_m} onChange={(e) => setCreateForm({ ...createForm, notify_radius_m: e.target.value })} />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Daxil edilən rəqəm metr ilə hesablanır (məs: 500 = 500 metr).</div>
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