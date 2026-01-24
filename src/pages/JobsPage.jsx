import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../lib/api'

export default function JobsPage(){
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

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

  const openEdit = (j) => {
    setSelected({
      ...j,
      title: j.title || '',
      category: j.category || '',
      wage: j.wage || '',
      whatsapp: j.whatsapp || '',
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
        title: selected.title,
        category: selected.category || null,
        wage: selected.wage || null,
        whatsapp: selected.whatsapp || null,
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

  return (
    <Layout title="Elanlar">
      <div className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <div className="row">
            <input className="input" placeholder="Başlıq/kateqoriya/təsvir axtar" value={q} onChange={(e)=>setQ(e.target.value)} style={{width:340}} />
            <button className="btn" onClick={load} disabled={loading}>Axtar</button>
          </div>
          <div className="muted">Göstərilir: {items.length}</div>
        </div>
        {error ? <div className="pill bad" style={{marginTop:12}}>{error}</div> : null}

        <div className="tableWrap" style={{marginTop:12}}>
          <table className="table">
            <thead>
              <tr>
                <th>Başlıq</th>
                <th>Kateqoriya</th>
                <th>Gündəlik</th>
                <th>Maaş</th>
                <th>Yaradan</th>
                <th>Tarix</th>
                <th style={{width:160}}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {items.map((j) => (
                <tr key={j.id}>
                  <td style={{fontWeight:700}}>{j.title}</td>
                  <td className="muted">{j.category || '-'}</td>
                  <td>{j.is_daily ? <span className="pill good">Bəli</span> : <span className="pill">Xeyr</span>}</td>
                  <td className="muted">{j.wage || '-'}</td>
                  <td className="mono">{j.created_by}</td>
                  <td className="muted">{new Date(j.created_at).toLocaleString('az-AZ')}</td>
                  <td>
                    <div className="row">
                      <button className="btn ghost" onClick={()=>openEdit(j)}>Düzəliş</button>
                      <button className="btn danger" onClick={()=>del(j.id)}>Sil</button>
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
        onClose={()=>setSelected(null)}
        footer={
          <>
            <button className="btn ghost" onClick={()=>setSelected(null)} disabled={saving}>Ləğv et</button>
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
            <div className="label">Başlıq</div>
            <input className="input" value={selected?.title || ''} onChange={(e)=>setSelected({...selected, title: e.target.value})} />
          </div>
          <div className="formRow">
            <div className="label">Kateqoriya</div>
            <input className="input" value={selected?.category || ''} onChange={(e)=>setSelected({...selected, category: e.target.value})} />
          </div>

          <div className="formRow">
            <div className="label">Gündəlik iş?</div>
            <select className="select" value={selected?.is_daily ? 'true' : 'false'} onChange={(e)=>setSelected({...selected, is_daily: e.target.value === 'true'})}>
              <option value="false">Xeyr</option>
              <option value="true">Bəli</option>
            </select>
          </div>
          <div className="formRow">
            <div className="label">Bildiriş radiusu (m)</div>
            <input className="input" value={selected?.notify_radius_m || ''} onChange={(e)=>setSelected({...selected, notify_radius_m: e.target.value})} />
          </div>

          <div className="formRow">
            <div className="label">Maaş</div>
            <input className="input" value={selected?.wage || ''} onChange={(e)=>setSelected({...selected, wage: e.target.value})} />
          </div>
          <div className="formRow">
            <div className="label">WhatsApp</div>
            <input className="input" value={selected?.whatsapp || ''} onChange={(e)=>setSelected({...selected, whatsapp: e.target.value})} />
          </div>

          <div className="formRow" style={{gridColumn:'span 2'}}>
            <div className="label">Lokasiya ünvanı</div>
            <input className="input" value={selected?.location_address || ''} onChange={(e)=>setSelected({...selected, location_address: e.target.value})} />
          </div>
          <div className="formRow" style={{gridColumn:'span 2'}}>
            <div className="label">Təsvir</div>
            <textarea className="input" rows={5} value={selected?.description || ''} onChange={(e)=>setSelected({...selected, description: e.target.value})} />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
