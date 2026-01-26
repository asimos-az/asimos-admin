import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../lib/api'

function toInt(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function CategoriesPage(){
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const idToName = useMemo(() => {
    const m = new Map()
    for (const c of items) m.set(c.id, c.name || '-')
    return m
  }, [items])

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.get('/admin/categories', { params: { q, limit: 500 } })
      setItems(data?.items || [])
      if (data?.categoriesSetupRequired) {
        setError(data?.hint || 'Kateqoriyalar cədvəli Supabase-də yaradılmayıb.')
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = (parentId = null) => {
    setEditing({ name: '', slug: '', sort: 0, is_active: true, parent_id: parentId })
    setOpen(true)
  }

  const openEdit = (c) => {
    setEditing({
      id: c.id,
      name: c.name || '',
      slug: c.slug || '',
      sort: toInt(c.sort, 0),
      is_active: c.is_active !== false,
      parent_id: c.parent_id || null,
      created_at: c.created_at,
    })
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = async () => {
    if (!editing) return
    if (!editing.name?.trim()) {
      alert('Kateqoriya adı vacibdir.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: editing.name,
        slug: editing.slug,
        sort: toInt(editing.sort, 0),
        is_active: !!editing.is_active,
        parent_id: editing.parent_id || null,
      }
      if (editing.id) {
        await api.patch(`/admin/categories/${editing.id}`, payload)
      } else {
        await api.post('/admin/categories', payload)
      }
      close()
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Yadda saxlamaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id) => {
    if (!confirm('Bu kateqoriyanı silmək istəyirsiniz?')) return
    try {
      await api.delete(`/admin/categories/${id}`)
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Silmək alınmadı')
    }
  }

  // Build a slightly nicer ordering (parents first, then children)
  const ordered = useMemo(() => {
    const parents = []
    const childrenByParent = new Map()
    for (const c of items) {
      if (!c.parent_id) parents.push(c)
      else {
        if (!childrenByParent.has(c.parent_id)) childrenByParent.set(c.parent_id, [])
        childrenByParent.get(c.parent_id).push(c)
      }
    }
    const sortFn = (a, b) => (toInt(a.sort, 0) - toInt(b.sort, 0)) || String(a.name||'').localeCompare(String(b.name||''))
    parents.sort(sortFn)
    for (const list of childrenByParent.values()) list.sort(sortFn)

    const out = []
    for (const p of parents) {
      out.push(p)
      const kids = childrenByParent.get(p.id) || []
      for (const k of kids) out.push({ ...k, __isChild: true })
    }
    // Orphans (parent deleted) – keep them at the end
    const orphans = items.filter(x => x.parent_id && !idToName.has(x.parent_id))
    if (orphans.length) {
      orphans.sort(sortFn)
      for (const o of orphans) out.push({ ...o, __isChild: true })
    }
    return out
  }, [items, idToName])

  const parentOptions = useMemo(() => {
    const opts = (items || []).map(c => ({ id: c.id, name: c.name }))
    opts.sort((a,b) => String(a.name||'').localeCompare(String(b.name||'')))
    return opts
  }, [items])

  return (
    <Layout title="Kateqoriyalar" subtitle="Mobil app üçün kateqoriyaları və alt-kateqoriyaları idarə edin.">
      <div className="card">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center', flexWrap:'wrap'}}>
          <div className="row" style={{flexWrap:'wrap'}}>
            <input className="input" placeholder="Ad/slug axtar" value={q} onChange={(e)=>setQ(e.target.value)} style={{width:320, maxWidth:'100%'}} />
            <button className="btn" onClick={load} disabled={loading}>Axtar</button>
          </div>
          <div className="row" style={{gap:10, flexWrap:'wrap', justifyContent:'flex-end'}}>
            <div className="muted">Göstərilir: {items.length}</div>
            <button className="btn primary" onClick={()=>openCreate(null)}>+ Yeni kateqoriya</button>
          </div>
        </div>

        {error ? <div className="pill warn" style={{marginTop:12}}>{error}</div> : null}

        <div className="tableWrap" style={{marginTop:12}}>
          <table className="table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Parent</th>
                <th>Slug</th>
                <th>Sort</th>
                <th>Aktiv</th>
                <th>Tarix</th>
                <th style={{width:220}}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((c) => (
                <tr key={c.id}>
                  <td style={{fontWeight:800}}>
                    <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                      {c.__isChild ? <span className="pill" style={{padding:'2px 8px'}}>Alt</span> : null}
                      <span style={{paddingLeft: c.__isChild ? 10 : 0}}>
                        {c.__isChild ? '↳ ' : ''}{c.name}
                      </span>
                    </span>
                  </td>
                  <td className="muted">
                    {c.parent_id ? (idToName.get(c.parent_id) || '—') : <span className="pill">—</span>}
                  </td>
                  <td className="mono muted">{c.slug}</td>
                  <td className="muted">{toInt(c.sort, 0)}</td>
                  <td>{c.is_active ? <span className="pill good">Bəli</span> : <span className="pill">Xeyr</span>}</td>
                  <td className="muted">{c.created_at ? new Date(c.created_at).toLocaleString('az-AZ') : '-'}</td>
                  <td>
                    <div className="row" style={{flexWrap:'wrap'}}>
                      {!c.__isChild ? (
                        <button className="btn ghost" onClick={()=>openCreate(c.id)}>+ Alt</button>
                      ) : null}
                      <button className="btn ghost" onClick={()=>openEdit(c)}>Düzəliş</button>
                      <button className="btn danger" onClick={()=>del(c.id)}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading ? <tr><td colSpan="7" className="muted">Yüklənir…</td></tr> : null}
              {!loading && items.length === 0 ? <tr><td colSpan="7" className="muted">Kateqoriya tapılmadı.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title={editing?.id ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}
        onClose={close}
        footer={
          <>
            <button className="btn ghost" onClick={close} disabled={saving}>Ləğv et</button>
            <button className="btn primary" onClick={save} disabled={saving}>{saving ? 'Yadda saxlanır…' : 'Yadda saxla'}</button>
          </>
        }
      >
        <div className="formGrid">
          {editing?.id ? (
            <>
              <div className="formRow">
                <div className="label">Kateqoriya ID</div>
                <div className="mono">{editing.id}</div>
              </div>
              <div className="formRow">
                <div className="label">Yaranma tarixi</div>
                <div className="muted">{editing.created_at ? new Date(editing.created_at).toLocaleString('az-AZ') : '-'}</div>
              </div>
            </>
          ) : null}

          <div className="formRow">
            <div className="label">Parent (istəyə bağlı)</div>
            <select
              className="select"
              value={editing?.parent_id || ''}
              onChange={(e)=>setEditing({...editing, parent_id: e.target.value || null})}
            >
              <option value="">— (Parent yoxdur)</option>
              {parentOptions
                .filter(p => p.id !== editing?.id) // can't be parent of itself
                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
              }
            </select>
            <div className="muted" style={{fontSize:12, marginTop:6}}>Alt-kateqoriya yaratmaq üçün parent seç.</div>
          </div>

          <div className="formRow">
            <div className="label">Ad</div>
            <input className="input" value={editing?.name || ''} onChange={(e)=>setEditing({...editing, name: e.target.value})} placeholder="Məs: Restoran" />
            <div className="muted" style={{fontSize:12, marginTop:6}}>Slug boş olsa, avtomatik generasiya olunacaq.</div>
          </div>

          <div className="formRow">
            <div className="label">Slug</div>
            <input className="input" value={editing?.slug || ''} onChange={(e)=>setEditing({...editing, slug: e.target.value})} placeholder="məs: restoran" />
          </div>

          <div className="formRow">
            <div className="label">Sort</div>
            <input className="input" value={String(editing?.sort ?? 0)} onChange={(e)=>setEditing({...editing, sort: e.target.value})} />
          </div>

          <div className="formRow">
            <div className="label">Aktiv?</div>
            <select className="select" value={editing?.is_active ? 'true' : 'false'} onChange={(e)=>setEditing({...editing, is_active: e.target.value === 'true'})}>
              <option value="true">Bəli</option>
              <option value="false">Xeyr</option>
            </select>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
