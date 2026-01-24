import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'

export default function EventsPage(){
  const [type, setType] = useState('')
  const [actorId, setActorId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')

  const load = async () => {
    setError('')
    setHint('')
    setLoading(true)
    try{
      const { data } = await api.get('/admin/events', { params: { type, actorId, limit: 100 } })
      setItems(data?.items || [])
      if (data?.eventsSetupRequired) {
        setHint(data?.hint || 'events cədvəli mövcud deyil. Supabase SQL Editor-də migrations faylını run edin.')
      }
    }catch(e){
      setError(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Layout title="Proseslər">
      {error ? <div className="card"><div className="pill bad">{error}</div></div> : null}
      {hint ? <div className="card"><div className="pill">{hint}</div></div> : null}
      {hint ? <div className="card" style={{marginTop:12}}><div className="pill">{hint}</div></div> : null}

      <div className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:800}}>Proses axını</div>
            <div className="muted">Qeydiyyat, giriş, lokasiya, elan yaratma və s. proseslər burada görünür.</div>
          </div>
          <div className="row">
            <input className="input" style={{width:180}} placeholder="növ (məs: auth_login)" value={type} onChange={(e)=>setType(e.target.value)} />
            <input className="input" style={{width:260}} placeholder="actor_id" value={actorId} onChange={(e)=>setActorId(e.target.value)} />
            <button className="btn" onClick={load} disabled={loading}>{loading ? 'Yüklənir…' : 'Filtrlə'}</button>
          </div>
        </div>

        <div className="tableWrap" style={{marginTop:12}}>
          <table className="table">
            <thead>
              <tr>
                <th>Vaxt</th>
                <th>Növ</th>
                <th>İstifadəçi</th>
                <th>Məlumat</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((ev) => (
                <tr key={ev.id}>
                  <td className="muted">{new Date(ev.created_at).toLocaleString('az-AZ')}</td>
                  <td><span className="pill">{ev.type}</span></td>
                  <td className="mono">{ev.actor_id || '-'}</td>
                  <td className="mono" style={{maxWidth:520, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                    {ev.metadata ? JSON.stringify(ev.metadata) : '-'}
                  </td>
                </tr>
              ))}
              {(!loading && (items || []).length === 0) ? <tr><td colSpan="4" className="muted">Heç bir proses tapılmadı.</td></tr> : null}
              {loading ? <tr><td colSpan="4" className="muted">Yüklənir…</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
