import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const cardConfigs = {
  sponsored: {
    title: 'Sponsorlu kart',
    label: 'Sponsorlu',
    subtitle: 'Son elanlar bölməsində ən üstdə pin olaraq görünür.',
    help: 'Sponsorlu seçilərsə web-də “Son elanlar” və “Elanlar” siyahısında birinci sabit kart kimi çıxacaq.',
    defaultLogo: 'AS',
    defaultBadge: 'Sponsorlu',
    defaultCta: 'Ətraflı bax',
    placement: 'Ən üstdə',
  },
  recommended: {
    title: 'Tövsiyə olunan kart',
    label: 'Tövsiyə olunan',
    subtitle: '4 elandan sonra pin olaraq görünür.',
    help: 'Tövsiyə olunan seçilərsə web-də 4 real elandan sonra sabit kart kimi çıxacaq.',
    defaultLogo: '🎓',
    defaultBadge: 'Tövsiyə olunur',
    defaultCta: 'Kursa yazıl',
    placement: '4 elandan sonra',
  },
}

const makeDefaultForm = (type = 'sponsored') => ({
  card_type: type,
  title: '',
  company_name: '',
  subtitle: '',
  description: '',
  cta_label: cardConfigs[type]?.defaultCta || 'Ətraflı bax',
  cta_url: '',
  logo_text: cardConfigs[type]?.defaultLogo || 'AS',
  badge_label: cardConfigs[type]?.defaultBadge || 'Sponsorlu',
  is_active: true,
})

function normalizeItem(item, type) {
  const config = cardConfigs[type]
  return {
    card_type: type,
    title: item?.title || '',
    company_name: item?.company_name || item?.companyName || '',
    subtitle: item?.subtitle || '',
    description: item?.description || '',
    cta_label: item?.cta_label || item?.ctaLabel || config.defaultCta,
    cta_url: item?.cta_url || item?.ctaUrl || '',
    logo_text: item?.logo_text || item?.logoText || config.defaultLogo,
    badge_label: item?.badge_label || item?.badgeLabel || config.defaultBadge,
    is_active: item?.is_active ?? item?.isActive ?? true,
  }
}

function PromoPreview({ form }) {
  return (
    <div style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)', borderRadius: 18, padding: 18, display: 'grid', gridTemplateColumns: '58px 1fr auto', gap: 14 }}>
      <div style={{ width: 58, height: 58, borderRadius: 16, background: '#dff7f1', border: '1px solid #bae6d8', color: '#18a477', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{form.logo_text || 'AS'}</div>
      <div>
        <div style={{ fontWeight: 800, color: '#111827' }}>{form.title || 'Kart başlığı'}</div>
        <div className="muted" style={{ marginTop: 6 }}>{[form.company_name || 'Brend adı', form.subtitle || 'Alt mətn'].filter(Boolean).join(' • ')}</div>
        <p style={{ margin: '12px 0', color: '#4b5563' }}>{form.description || 'Kart açıqlaması burada görünəcək.'}</p>
        <div style={{ color: '#1d5fae', fontWeight: 800 }}>{form.cta_label || 'Ətraflı bax'} →</div>
      </div>
      <div><span className="pill info">{form.badge_label || 'Sponsorlu'}</span></div>
    </div>
  )
}

export default function SponsoredCardPage() {
  const [activeType, setActiveType] = useState('sponsored')
  const [forms, setForms] = useState({
    sponsored: makeDefaultForm('sponsored'),
    recommended: makeDefaultForm('recommended'),
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrationRequired, setMigrationRequired] = useState(false)

  const config = cardConfigs[activeType]
  const form = forms[activeType]

  const activeSummary = useMemo(() => ({
    sponsored: forms.sponsored?.title ? (forms.sponsored.is_active ? 'Aktiv' : 'Deaktiv') : 'Yaradılmayıb',
    recommended: forms.recommended?.title ? (forms.recommended.is_active ? 'Aktiv' : 'Deaktiv') : 'Yaradılmayıb',
  }), [forms])

  const setForm = (nextForm) => {
    setForms((current) => ({ ...current, [activeType]: nextForm }))
  }

  const patch = (next) => setForm({ ...form, ...next })

  const handleTypeChange = (nextType) => {
    const nextConfig = cardConfigs[nextType]
    setActiveType(nextType)
    setForms((current) => {
      const existing = current[nextType] || makeDefaultForm(nextType)
      return {
        ...current,
        [nextType]: {
          ...existing,
          card_type: nextType,
          badge_label: existing.badge_label || nextConfig.defaultBadge,
          logo_text: existing.logo_text || nextConfig.defaultLogo,
          cta_label: existing.cta_label || nextConfig.defaultCta,
        },
      }
    })
  }

  const load = async () => {
    setLoading(true)
    setMigrationRequired(false)
    try {
      const { data } = await api.get('/admin/sponsored-cards')
      if (data?.migrationRequired) setMigrationRequired(true)
      setForms({
        sponsored: data?.sponsored ? normalizeItem(data.sponsored, 'sponsored') : makeDefaultForm('sponsored'),
        recommended: data?.recommended ? normalizeItem(data.recommended, 'recommended') : makeDefaultForm('recommended'),
      })
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Pin kartlar yüklənmədi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim()) return toast.error('Başlıq boş ola bilməz')
    setSaving(true)
    try {
      await api.put('/admin/sponsored-card', {
        ...form,
        card_type: activeType,
        badge_label: (form.badge_label || config.defaultBadge).trim(),
        logo_text: (form.logo_text || config.defaultLogo).trim().slice(0, 4),
      }, { params: { cardType: activeType } })
      toast.success(`${config.title} yadda saxlandı`)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Yadda saxlamaq alınmadı')
    } finally {
      setSaving(false)
    }
  }

  const disable = async () => {
    if (!confirm(`${config.title} deaktiv edilsin?`)) return
    setSaving(true)
    try {
      await api.delete('/admin/sponsored-card', { params: { cardType: activeType } })
      toast.success(`${config.title} deaktiv edildi`)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Deaktiv etmək alınmadı')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="Pin kartlar" subtitle="Sponsorlu kartı ən üstdə, tövsiyə olunan kartı isə 4 elandan sonra göstərmək üçün buradan idarə edin.">
      {migrationRequired ? (
        <div className="alert error" style={{ marginBottom: 14 }}>
          DB-də <b>sponsored_cards</b> cədvəli yenilənməyib. Backend zip-dəki <b>sponsored_card_migration.sql</b> faylını Supabase SQL Editor-da bir dəfə çalışdırın.
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Kart növünü seç</h2>
            <p className="muted" style={{ marginTop: 6 }}>Eyni formadan həm sponsorlu, həm də tövsiyə olunan kartı yarada bilərsən.</p>
          </div>
          <button className="btn ghost" onClick={load} disabled={loading || saving}>Yenilə</button>
        </div>

        <div className="formGrid" style={{ marginTop: 18 }}>
          <div className="formRow">
            <div className="label">Kart növü / badge</div>
            <select className="select" value={activeType} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="sponsored">Sponsorlu — web-də ən üstdə</option>
              <option value="recommended">Tövsiyə olunan — 4 elandan sonra</option>
            </select>
          </div>
          <div className="formRow">
            <div className="label">Yerləşmə</div>
            <input className="input" value={config.placement} readOnly />
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="pill info">Sponsorlu: {activeSummary.sponsored}</span>
          <span className="pill success">Tövsiyə olunan: {activeSummary.recommended}</span>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0 }}>{config.title}</h2>
            <p className="muted" style={{ marginTop: 6 }}>{config.subtitle}</p>
            <p className="muted" style={{ marginTop: 4 }}>{config.help}</p>
          </div>
          <button className="btn danger" onClick={disable} disabled={loading || saving}>Deaktiv et</button>
        </div>

        <div className="formGrid" style={{ marginTop: 18 }}>
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Başlıq</div>
            <input className="input" value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder={activeType === 'sponsored' ? 'HR Audit Xidməti — Şirkətinizin işə alma prosesini gücləndirin' : 'HR Mütəxəssisi Olmaq Kursu'} />
          </div>
          <div className="formRow">
            <div className="label">Şirkət / brend adı</div>
            <input className="input" value={form.company_name} onChange={(e) => patch({ company_name: e.target.value })} placeholder={activeType === 'sponsored' ? 'Asimos HR Coaching' : 'Aylıq abunə'} />
          </div>
          <div className="formRow">
            <div className="label">Alt mətn</div>
            <input className="input" value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} placeholder={activeType === 'sponsored' ? 'Onlayn məsləhət' : 'Onlayn dərslər'} />
          </div>
          <div className="formRow" style={{ gridColumn: 'span 2' }}>
            <div className="label">Açıqlama</div>
            <textarea className="input" rows={4} value={form.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Kartda görünəcək açıqlama" />
          </div>
          <div className="formRow">
            <div className="label">Logo mətni / ikon</div>
            <input className="input" value={form.logo_text} onChange={(e) => patch({ logo_text: e.target.value.slice(0, 4) })} placeholder={config.defaultLogo} />
          </div>
          <div className="formRow">
            <div className="label">Badge yazısı</div>
            <input className="input" value={form.badge_label} onChange={(e) => patch({ badge_label: e.target.value })} placeholder={config.defaultBadge} />
          </div>
          <div className="formRow">
            <div className="label">Button mətni</div>
            <input className="input" value={form.cta_label} onChange={(e) => patch({ cta_label: e.target.value })} placeholder={config.defaultCta} />
          </div>
          <div className="formRow">
            <div className="label">Keçid linki</div>
            <input className="input" value={form.cta_url} onChange={(e) => patch({ cta_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="formRow">
            <div className="label">Status</div>
            <select className="select" value={form.is_active ? 'true' : 'false'} onChange={(e) => patch({ is_active: e.target.value === 'true' })}>
              <option value="true">Aktiv</option>
              <option value="false">Deaktiv</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <button className="btn" onClick={save} disabled={saving || loading}>{saving ? 'Yadda saxlanır…' : 'Yadda saxla'}</button>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="label" style={{ marginBottom: 10 }}>Web-də görünüş nümunəsi</div>
          <PromoPreview form={form} />
        </div>
      </div>
    </Layout>
  )
}
