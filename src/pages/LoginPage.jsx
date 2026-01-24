import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { setToken } from '../lib/auth'

export default function LoginPage(){
  const nav = useNavigate()
  const loc = useLocation()
  const from = loc.state?.from || '/'

  const [email, setEmail] = useState('admin@asimos.local')
  const [password, setPassword] = useState('admin1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Normalize to avoid invisible spaces / casing issues
      const emailClean = String(email || '').trim().toLowerCase()
      const passwordClean = String(password || '').trim()
      const { data } = await api.post('/admin/login', { email: emailClean, password: passwordClean })
      if (!data?.token) throw new Error('Token not returned')
      setToken(data.token)
      nav(from, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Giriş alınmadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginWrap">
      <div className="loginHero">
        <div className="heroCard">
          <div className="row" style={{justifyContent:'space-between'}}>
            <div className="row">
              <div className="brandMark" style={{width:46, height:46}}>A</div>
              <div>
                <div className="brandTitle">Asimos</div>
                <div className="brandSub">Admin Panel</div>
              </div>
            </div>
            <div className="pill"><Sparkles size={14}/> Kreativ dizayn</div>
          </div>

          <div className="heroTitle" style={{marginTop:18}}>
            Hər şeyi idarə et,
            <br />
            tək paneldən.
          </div>
          <div className="heroSub">
            İstifadəçilər, elanlar və mobil tətbiqdə baş verən bütün proseslər — hamısı burada.
            Sürətli filtr, səliqəli cədvəllər və təhlükəsiz admin əməliyyatları.
          </div>
          <div className="heroPills">
            <span className="pill good"><Shield size={14}/> Təhlükəsiz admin token</span>
            <span className="pill">İstifadəçi idarəsi</span>
            <span className="pill">Elan idarəsi</span>
            <span className="pill">Proses logları</span>
          </div>
        </div>
      </div>

      <div className="loginPane">
        <div className="loginCard">
          <div className="row" style={{justifyContent:'center', marginBottom:6}}>
            <div className="brandMark" style={{width:56, height:56}}>A</div>
          </div>
          <div className="h1" style={{textAlign:'center'}}>Daxil ol</div>
          <div className="muted" style={{textAlign:'center', marginTop:6}}>
            Super Admin (sabit)
          </div>

          <form onSubmit={submit} style={{marginTop:16}}>
            <div className="field">
              <label>Email</label>
              <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@..." />
            </div>
            <div className="field">
              <label>Şifrə</label>
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error ? <div className="pill bad" style={{marginTop:10}}>{error}</div> : null}

            <button className="btn primary full" disabled={loading} style={{marginTop:14}}>
              {loading ? 'Daxil olunur…' : 'Daxil ol'}
            </button>

            <div className="muted" style={{marginTop:12, fontSize:12}}>
              API: {import.meta.env.VITE_API_BASE_URL || 'https://asimos-backend.onrender.com'}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
