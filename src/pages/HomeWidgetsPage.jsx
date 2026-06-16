import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

const defaultUsefulInfo = {
  title: 'Faydalı məlumat',
  button_label: '📚 Faydalı məlumat',
  is_active: true,
  items: [
    { title: 'Əmək Məcəlləsi (e-qanun.az)', url: 'https://e-qanun.az/framework/46943', icon: '📥' },
    { title: 'DOST mərkəzləri — iş axtaranlar üçün', url: 'https://dost.gov.az/', icon: '📥' },
    { title: 'Rəsmi VÖEN sorğusu', url: 'https://www.e-taxes.gov.az/', icon: '📥' },
    { title: 'CV hazırlama bələdçisi', url: 'https://asimos.az', icon: '📥' },
    { title: 'Müsahibəyə hazırlıq tövsiyələri', url: 'https://asimos.az', icon: '📥' },
  ],
}

const defaultIdea = {
  title: 'Yeni ideyan var?',
  button_label: '💡 Yeni ideyan var?',
  description: 'Asimos.az-ı necə daha yaxşı edə bilərik? İdeyanı yaz, mail vasitəsilə bizə göndər.',
  email_to: 'lduo4737@gmail.com',
  email_subject: 'Asimos.az üçün yeni ideya',
  textarea_placeholder: 'İdeyanı buraya yaz...',
  cta_label: '✉️ Mail ilə göndər',
  is_active: true,
}

function normalizeUsefulInfo(data) {
  return {
    ...defaultUsefulInfo,
    ...(data || {}),
    button_label: data?.button_label || data?.buttonLabel || defaultUsefulInfo.button_label,
    is_active: data?.is_active ?? data?.isActive ?? true,
    items: Array.isArray(data?.items) && data.items.length ? data.items : defaultUsefulInfo.items,
  }
}

function normalizeIdea(data) {
  return {
    ...defaultIdea,
    ...(data || {}),
    button_label: data?.button_label || data?.buttonLabel || defaultIdea.button_label,
    email_to: data?.email_to || data?.emailTo || defaultIdea.email_to,
    email_subject: data?.email_subject || data?.emailSubject || defaultIdea.email_subject,
    textarea_placeholder: data?.textarea_placeholder || data?.textareaPlaceholder || defaultIdea.textarea_placeholder,
    cta_label: data?.cta_label || data?.ctaLabel || defaultIdea.cta_label,
    is_active: data?.is_active ?? data?.isActive ?? true,
  }
}

export default function HomeWidgetsPage() {
  const [usefulInfo, setUsefulInfo] = useState(defaultUsefulInfo)
  const [idea, setIdea] = useState(defaultIdea)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrationRequired, setMigrationRequired] = useState(false)

  const patchUseful = (patch) => setUsefulInfo((current) => ({ ...current, ...patch }))
  const patchIdea = (patch) => setIdea((current) => ({ ...current, ...patch }))

  const updateUsefulItem = (index, patch) => {
    setUsefulInfo((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }))
  }

  const addUsefulItem = () => {
    setUsefulInfo((current) => ({
      ...current,
      items: [...current.items, { title: '', url: '', icon: '📥' }],
    }))
  }

  const removeUsefulItem = (index) => {
    setUsefulInfo((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const load = async () => {
    setLoading(true)
    setMigrationRequired(false)
    try {
      const { data } = await api.get('/admin/home-widgets')
      if (data?.migrationRequired) setMigrationRequired(true)
      setUsefulInfo(normalizeUsefulInfo(data?.useful_info || data?.usefulInfo))
      setIdea(normalizeIdea(data?.idea))
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Home düymələri yüklənmədi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (idea.is_active && !String(idea.email_to || '').trim()) {
      return toast.error('Yeni ideya aktivdirsə email boş ola bilməz')
    }

    setSaving(true)
    try {
      await api.put('/admin/home-widgets', {
        useful_info: {
          title: usefulInfo.title,
          button_label: usefulInfo.button_label,
          is_active: usefulInfo.is_active,
          items: usefulInfo.items,
        },
        idea,
      })
      toast.success('Home fixed düymələri yadda saxlandı')
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Yadda saxlamaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="Home fixed düymələri" subtitle="Home page solunda Faydalı məlumat, sağında Yeni ideyan var? düymələrini idarə edin.">
      {migrationRequired ? (
        <div className="alert error" style={{ marginBottom: 14 }}>
          DB-də <b>home_widgets</b> cədvəli yoxdur. Backend zip-dəki <b>home_widgets_migration.sql</b> faylını Supabase SQL Editor-da bir dəfə çalışdırın.
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>📚 Faydalı məlumat</h2>
            <p className="muted" style={{ marginTop: 6 }}>Home page-in sol aşağı hissəsində fixed düymə kimi çıxır. Klik ediləndə siyahı açılır və linklər kliklənir.</p>
          </div>
          <select className="select" style={{ maxWidth: 180 }} value={usefulInfo.is_active ? 'true' : 'false'} onChange={(e) => patchUseful({ is_active: e.target.value === 'true' })}>
            <option value="true">Aktiv</option>
            <option value="false">Deaktiv</option>
          </select>
        </div>

        <div className="formGrid" style={{ marginTop: 18 }}>
          <div className="formRow">
            <div className="label">Popup başlığı</div>
            <input className="input" value={usefulInfo.title} onChange={(e) => patchUseful({ title: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Fixed button mətni</div>
            <input className="input" value={usefulInfo.button_label} onChange={(e) => patchUseful({ button_label: e.target.value })} />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="label">Siyahı linkləri</div>
            <button type="button" className="btn ghost" onClick={addUsefulItem}><Plus size={16} /> Link əlavə et</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {usefulInfo.items.map((item, index) => (
              <div key={index} className="formGrid" style={{ gridTemplateColumns: '90px 1fr 1fr 52px', gap: 10, alignItems: 'end' }}>
                <div className="formRow">
                  <div className="label">İkon</div>
                  <input className="input" value={item.icon || ''} onChange={(e) => updateUsefulItem(index, { icon: e.target.value })} />
                </div>
                <div className="formRow">
                  <div className="label">Ad</div>
                  <input className="input" value={item.title || ''} onChange={(e) => updateUsefulItem(index, { title: e.target.value })} placeholder="CV hazırlama bələdçisi" />
                </div>
                <div className="formRow">
                  <div className="label">Link</div>
                  <input className="input" value={item.url || ''} onChange={(e) => updateUsefulItem(index, { url: e.target.value })} placeholder="https://..." />
                </div>
                <button type="button" className="iconBtn" style={{ color: '#ef4444' }} onClick={() => removeUsefulItem(index)} aria-label="Sil"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>💡 Yeni ideyan var?</h2>
            <p className="muted" style={{ marginTop: 6 }}>Home page-in sağ aşağı hissəsində fixed düymə kimi çıxır. Klik ediləndə modal açılır və istifadəçi yazdığı ideyanı mail ilə göndərir.</p>
          </div>
          <select className="select" style={{ maxWidth: 180 }} value={idea.is_active ? 'true' : 'false'} onChange={(e) => patchIdea({ is_active: e.target.value === 'true' })}>
            <option value="true">Aktiv</option>
            <option value="false">Deaktiv</option>
          </select>
        </div>

        <div className="formGrid" style={{ marginTop: 18 }}>
          <div className="formRow">
            <div className="label">Modal başlığı</div>
            <input className="input" value={idea.title} onChange={(e) => patchIdea({ title: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Fixed button mətni</div>
            <input className="input" value={idea.button_label} onChange={(e) => patchIdea({ button_label: e.target.value })} />
          </div>
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Modal açıqlaması</div>
            <textarea className="input" rows={3} value={idea.description} onChange={(e) => patchIdea({ description: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Göndəriləcək email</div>
            <input className="input" value={idea.email_to} onChange={(e) => patchIdea({ email_to: e.target.value })} placeholder="info@asimos.az" />
          </div>
          <div className="formRow">
            <div className="label">Email mövzusu</div>
            <input className="input" value={idea.email_subject} onChange={(e) => patchIdea({ email_subject: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Textarea placeholder</div>
            <input className="input" value={idea.textarea_placeholder} onChange={(e) => patchIdea({ textarea_placeholder: e.target.value })} />
          </div>
          <div className="formRow">
            <div className="label">Göndər buttonu</div>
            <input className="input" value={idea.cta_label} onChange={(e) => patchIdea({ cta_label: e.target.value })} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="btn" onClick={save} disabled={saving || loading}>{saving ? 'Yadda saxlanır…' : 'Hamısını yadda saxla'}</button>
      </div>
    </Layout>
  )
}
