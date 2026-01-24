import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'

function KpiCard({ label, value }) {
  return (
    <div className="kpi2Card">
      <div className="kpi2Label">{label}</div>
      <div className="kpi2Value">{value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  // Fallback aggregation (for older backends missing analytics fields)
  const enrichAnalyticsIfMissing = async (base) => {
    const next = { ...(base || {}) }
    try {
      const needsJobsAgg = !Array.isArray(next.jobsByCategory) || !Array.isArray(next.jobsByDay)
      if (needsJobsAgg) {
        const limit = 200
        let offset = 0
        const all = []
        for (let i = 0; i < 25; i++) {
          const r = await api.get('/admin/jobs', { params: { q: '', limit, offset } })
          const items = r.data?.items || []
          all.push(...items)
          if (items.length < limit) break
          offset += limit
        }

        const byCat = new Map()
        const byDay = new Map()
        for (const j of all) {
          const cat = String(j.category || 'Digər').trim() || 'Digər'
          byCat.set(cat, (byCat.get(cat) || 0) + 1)
          const d = String(j.created_at || '').slice(0, 10)
          if (d) byDay.set(d, (byDay.get(d) || 0) + 1)
        }
        next.jobsByCategory = Array.from(byCat.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }))
        next.jobsByDay = Array.from(byDay.entries())
          .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
          .map(([date, count]) => ({ date, count }))
      }
    } catch {
      // ignore fallback errors
    }
    return next
  }

  const load = async () => {
    setErr('')
    setLoading(true)
    try {
      const r = await api.get('/admin/dashboard')
      const enriched = await enrichAnalyticsIfMissing(r.data)
      setData(enriched)
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ok = true
    ;(async () => {
      try {
        setLoading(true)
        const r = await api.get('/admin/dashboard')
        if (!ok) return
        const enriched = await enrichAnalyticsIfMissing(r.data)
        if (!ok) return
        setData(enriched)
      } catch (e) {
        if (!ok) return
        setErr(e?.response?.data?.error || e.message || 'Yüklənmə zamanı xəta baş verdi')
      } finally {
        if (ok) setLoading(false)
      }
    })()
    return () => { ok = false }
  }, [])

  const roleData = useMemo(() => {
    // Backward compatible: older backends might not send usersByRole
    const seeker = Number(data?.usersByRole?.seeker ?? data?.seekersTotal ?? 0) || 0
    const employer = Number(data?.usersByRole?.employer ?? data?.employersTotal ?? 0) || 0
    return [
      { name: 'İş axtaran', value: seeker },
      { name: 'İşçi axtaran', value: employer },
    ]
  }, [data])

  const hasRoleData = useMemo(() => {
    return (roleData?.[0]?.value || 0) + (roleData?.[1]?.value || 0) > 0
  }, [roleData])

  const jobsByCategory = useMemo(() => {
    return (data?.jobsByCategory || []).map((x) => ({ name: x.name, say: Number(x.count) || 0 }))
  }, [data])

  const jobsByDay = useMemo(() => {
    return (data?.jobsByDay || []).map((x) => ({ date: x.date, say: Number(x.count) || 0 }))
  }, [data])

  const eventsByType = useMemo(() => {
    return (data?.eventsByType || []).map((x) => ({ name: x.type, say: Number(x.count) || 0 }))
  }, [data])

  const hasJobsByCategory = useMemo(
    () => (jobsByCategory || []).some((x) => (x.say || 0) > 0),
    [jobsByCategory]
  )
  const hasJobsByDay = useMemo(
    () => (jobsByDay || []).some((x) => (x.say || 0) > 0),
    [jobsByDay]
  )
  const hasEventsByType = useMemo(
    () => (eventsByType || []).some((x) => (x.say || 0) > 0),
    [eventsByType]
  )

  return (
    <Layout title="İdarə paneli" subtitle="Ümumi göstəricilər və analitika (chart).">
      {err ? (
        <div className="card"><div className="pill bad">{err}</div></div>
      ) : null}

      <div className="kpiGrid">
        <KpiCard label="Bütün istifadəçilər" value={data?.usersTotal ?? (loading ? '…' : 0)} />
        <KpiCard label="İş axtaranlar" value={data?.seekersTotal ?? (loading ? '…' : 0)} />
        <KpiCard label="İşçi axtaranlar" value={data?.employersTotal ?? (loading ? '…' : 0)} />
        <KpiCard label="Elanlar" value={data?.jobsTotal ?? (loading ? '…' : 0)} />
      </div>

      <div className="chartGrid" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="cardTitle">İstifadəçilər (rol üzrə)</div>
          <div className="muted" style={{ marginTop: 4 }}>Paylanma</div>
          <div className="chartBox">
            {hasRoleData ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={roleData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    stroke="rgba(255,255,255,.12)"
                    isAnimationActive={false}
                  >
                    <Cell fill="#60A5FA" />
                    <Cell fill="#34D399" />
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="emptyChart">Məlumat yoxdur.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Elanlar (kateqoriya üzrə)</div>
          <div className="muted" style={{ marginTop: 4 }}>Top 10</div>
          <div className="chartBox">
            {hasJobsByCategory ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={jobsByCategory} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.10)" />
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="say" fill="#60A5FA" radius={[10,10,0,0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="emptyChart">Məlumat yoxdur.</div>
            )}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Qeyd: Əgər kateqoriya boşdursa, "Digər" kimi sayılır.</div>
        </div>

        <div className="card">
          <div className="cardTitle">Elanlar (son 14 gün)</div>
          <div className="muted" style={{ marginTop: 4 }}>Günlük dinamika</div>
          <div className="chartBox">
            {hasJobsByDay ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={jobsByDay} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.10)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="say" dot={false} stroke="#34D399" strokeWidth={3} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="emptyChart">Məlumat yoxdur.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Proseslər (event növləri)</div>
          <div className="muted" style={{ marginTop: 4 }}>Top 10 (son 14 gün)</div>

          {data?.eventsSetupRequired ? (
            <div className="pill warn" style={{ marginTop: 12 }}>
              Qeyd: <b>events</b> cədvəli yaradılmayıb. Supabase SQL Editor-də <b>backend/supabase_migrations.sql</b> faylını run edin.
            </div>
          ) : null}

          <div className="chartBox">
            {hasEventsByType ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={eventsByType} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.10)" />
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="say" fill="#A78BFA" radius={[10,10,0,0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="emptyChart">Məlumat yoxdur.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="cardTitle">Son proseslər</div>
            <div className="muted">Mobil app-da baş verən proseslər (son 25).</div>
          </div>
          <button className="btn" onClick={load} disabled={loading}>Yenilə</button>
        </div>

        <div className="tableWrap" style={{ marginTop: 12 }}>
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
              {(data?.latestEvents || []).map((ev) => (
                <tr key={ev.id}>
                  <td className="muted">{new Date(ev.created_at).toLocaleString('az-AZ')}</td>
                  <td><span className="pill">{ev.type}</span></td>
                  <td className="mono">{ev.actor_id || '-'}</td>
                  <td className="mono" style={{ maxWidth: 520, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.metadata ? JSON.stringify(ev.metadata) : '-'}
                  </td>
                </tr>
              ))}
              {(!loading && (data?.latestEvents || []).length === 0) ? (
                <tr><td colSpan="4" className="muted">Hələ heç bir proses yoxdur.</td></tr>
              ) : null}
              {loading ? (
                <tr><td colSpan="4" className="muted">Yüklənir…</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
