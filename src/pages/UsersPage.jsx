import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../lib/api'

export default function UsersPage(){
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', { params: { q, role, limit: 50 } })
      setItems(data?.items || [])
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (u) => {
    setSelected({
      ...u,
      full_name: u.full_name || '',
      company_name: u.company_name || '',
      phone: u.phone || '',
      role: u.role || 'seeker',
    })
  }

  const save = async () => {
    if (!selected?.id) return
    setSaving(true)
    try {
      const payload = {
        role: selected.role,
        full_name: selected.full_name,
        company_name: selected.company_name || null,
        phone: selected.phone || null,
      }
      await api.patch(`/admin/users/${selected.id}`, payload)
      setSelected(null)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Yadda saxlamaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id) => {
    if (!id) return
    const ok = confirm('İstifadəçini silmək istəyirsiniz? Bu əməl profil + auth istifadəçisini siləcək.')
    if (!ok) return
    setSaving(true)
    try {
      await api.delete(`/admin/users/${id}`)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Silmək alınmadı')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="İstifadəçilər">
      <div className="card">
        <div className="row" style={{justifyContent:'space-between', flexWrap:'wrap'}}>
          <div className="row" style={{flexWrap:'wrap'}}>
            <input
              className="input"
              placeholder="Ad / şirkət / telefon axtar..."
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              style={{minWidth:260}}
            />
            <select className="select" value={role} onChange={(e)=>setRole(e.target.value)}>
              <option value="">Bütün rollar</option>
              <option value="seeker">İş axtaran</option>
              <option value="employer">İşçi axtaran</option>
            </select>
            <button className="btn" onClick={load} disabled={loading}>Axtar</button>
          </div>
          <div className="muted">{loading ? 'Yüklənir…' : `${items.length} istifadəçi`}</div>
        </div>
        {error ? <div className="pill bad" style={{marginTop:12}}>{error}</div> : null}

        <div className="tableWrap" style={{marginTop:12}}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ad Soyad</th>
                <th>Rol</th>
                <th>Şirkət</th>
                <th>Telefon</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="mono" style={{maxWidth:220, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.id}</td>
                  <td>{u.full_name || '-'}</td>
                  <td><span className="pill">{u.role || '-'}</span></td>
                  <td>{u.company_name || '-'}</td>
                  <td className="mono">{u.phone || '-'}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn ghost" onClick={()=>openEdit(u)} disabled={saving}>Düzəliş</button>
                    <button className="btn danger" onClick={()=>del(u.id)} disabled={saving}>Sil</button>
                  </td>
                </tr>
              ))}
              {(!loading && items.length === 0) ? <tr><td colSpan="6" className="muted">İstifadəçi yoxdur</td></tr> : null}
              {loading ? <tr><td colSpan="6" className="muted">Yüklənir…</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!selected}
        title="İstifadəçini redaktə et"
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
            <div className="label">İstifadəçi ID</div>
            <div className="mono">{selected?.id}</div>
          </div>
          <div className="formRow">
            <div className="label">Rol</div>
            <select className="select" value={selected?.role || 'seeker'} onChange={(e)=>setSelected({...selected, role: e.target.value})}>
              <option value="seeker">İş axtaran</option>
              <option value="employer">İşçi axtaran</option>
            </select>
          </div>
          <div className="formRow">
            <div className="label">Ad Soyad</div>
            <input className="input" value={selected?.full_name || ''} onChange={(e)=>setSelected({...selected, full_name: e.target.value})} />
          </div>
          <div className="formRow">
            <div className="label">Şirkət</div>
            <input className="input" value={selected?.company_name || ''} onChange={(e)=>setSelected({...selected, company_name: e.target.value})} />
          </div>
          <div className="formRow">
            <div className="label">Telefon</div>
            <input className="input" value={selected?.phone || ''} onChange={(e)=>setSelected({...selected, phone: e.target.value})} />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
