import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { AlertCircle, CheckCircle2, Facebook, Instagram, Linkedin, Loader2, MessageCircle, Save, Send, Settings as SettingsIcon } from 'lucide-react';

const defaultLinks = {
  facebook: '',
  instagram: '',
  tiktok: '',
  linkedin: '',
  twitter: '',
  telegram: '',
  whatsapp: '',
};

const defaultFilterOptions = {
  vacancyTypes: [],
  jobLevels: [],
  salaryRanges: [],
};

const fields = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/asimos.az', icon: Facebook },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/asimos_az', icon: Instagram },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@asimos', icon: SettingsIcon },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/asimos', icon: Linkedin },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/asimos_az', icon: SettingsIcon },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/asimos_az', icon: Send },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/994501234567', icon: MessageCircle },
];

function optionsToText(items = [], salary = false) {
  return (items || [])
    .map((item) => salary ? `${item.label || ''}|${item.min || ''}|${item.max || ''}` : `${item.label || ''}|${item.value || ''}`)
    .join('\n');
}

function textToOptions(text = '', salary = false) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((x) => x.trim());
      if (salary) return { label: parts[0], min: parts[1] || '', max: parts[2] || '' };
      return { label: parts[0], value: parts[1] || parts[0].toLowerCase().replace(/\s+/g, '_') };
    })
    .filter((item) => item.label);
}

export default function SettingsPage() {
  const [socialLinks, setSocialLinks] = useState(defaultLinks);
  const [filterText, setFilterText] = useState({ vacancyTypes: '', jobLevels: '', salaryRanges: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const [siteRes, filterRes] = await Promise.all([
        api.get('/admin/site-settings'),
        api.get('/admin/job-filter-options').catch(() => ({ data: defaultFilterOptions })),
      ]);
      setSocialLinks({ ...defaultLinks, ...(siteRes.data?.socialLinks || {}) });
      setFilterText({
        vacancyTypes: optionsToText(filterRes.data?.vacancyTypes || []),
        jobLevels: optionsToText(filterRes.data?.jobLevels || []),
        salaryRanges: optionsToText(filterRes.data?.salaryRanges || [], true),
      });
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.error || e.message || 'Ayarlar yüklənmədi' });
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    try {
      const socialPayload = {
        socialLinks: Object.fromEntries(
          Object.entries(socialLinks).map(([key, value]) => [key, String(value || '').trim()])
        ),
      };
      const filterPayload = {
        vacancyTypes: textToOptions(filterText.vacancyTypes),
        jobLevels: textToOptions(filterText.jobLevels),
        salaryRanges: textToOptions(filterText.salaryRanges, true),
      };

      const [siteRes, filterRes] = await Promise.all([
        api.put('/admin/site-settings', socialPayload),
        api.put('/admin/job-filter-options', filterPayload),
      ]);

      setSocialLinks({ ...defaultLinks, ...(siteRes.data?.socialLinks || socialPayload.socialLinks) });
      setFilterText({
        vacancyTypes: optionsToText(filterRes.data?.vacancyTypes || filterPayload.vacancyTypes),
        jobLevels: optionsToText(filterRes.data?.jobLevels || filterPayload.jobLevels),
        salaryRanges: optionsToText(filterRes.data?.salaryRanges || filterPayload.salaryRanges, true),
      });
      setMessage({ type: 'success', text: 'Ayarlar uğurla yadda saxlanıldı!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e?.response?.data?.error || e.message || 'Yadda saxlamaq mümkün olmadı' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Sayt Ayarları" subtitle="Footer sosial linkləri və elan filter seçimlərini buradan idarə edin.">
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {message && (
            <div className={`pill ${message.type === 'success' ? 'good' : 'bad'}`} style={{ padding: '8px 16px', borderRadius: 99, fontWeight: 500 }}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow2)', borderRadius: 'var(--r28)' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--stroke)', background: 'linear-gradient(to bottom, #fff, #fafafa)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="navIcon"><SettingsIcon size={18} /></div>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Footer sosial linkləri</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>Boş saxlanan linklər web footer-də göstərilməyəcək.</p>
              </div>
            </div>
          </div>

          <div style={{ padding: 32 }}>
            {loading ? (
              <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Loader2 className="animate-spin" size={24} /> Ayarlar yüklənir...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                {fields.map(({ key, label, placeholder, icon: Icon }) => (
                  <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={14} /> {label}</span>
                    <input className="input" value={socialLinks[key] || ''} onChange={(e) => updateField(key, e.target.value)} placeholder={placeholder} type="url" style={{ width: '100%' }} />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow2)', borderRadius: 'var(--r28)' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--stroke)', background: 'linear-gradient(to bottom, #fff, #fafafa)' }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Elan filter seçimləri</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              Hər sətri ayrıca yazın. Vakansiya və dərəcə formatı: <b>Ad|value</b>. Maaş formatı: <b>Ad|min|max</b>.
            </p>
          </div>

          <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="label">Vakansiyanın növü</span>
              <textarea className="input" rows={10} value={filterText.vacancyTypes} onChange={(e) => setFilterText((p) => ({ ...p, vacancyTypes: e.target.value }))} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="label">Vəzifə dərəcəsi</span>
              <textarea className="input" rows={10} value={filterText.jobLevels} onChange={(e) => setFilterText((p) => ({ ...p, jobLevels: e.target.value }))} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="label">Maaş aralığı</span>
              <textarea className="input" rows={10} value={filterText.salaryRanges} onChange={(e) => setFilterText((p) => ({ ...p, salaryRanges: e.target.value }))} />
            </label>
          </div>

          <div style={{ padding: '20px 32px', background: '#fafafa', borderTop: '1px solid var(--stroke)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button className="btn primary" onClick={saveSettings} disabled={saving || loading} style={{ padding: '14px 32px', fontSize: 16, fontWeight: 700, borderRadius: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'Saxlanılır...' : 'Yadda saxla'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
