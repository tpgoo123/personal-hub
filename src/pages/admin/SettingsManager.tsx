import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './AdminModules.css'

type SettingsForm = {
  display_name: string
  professional_title: string
  avatar_text: string
  introduction: string
  contact_email: string
  github_url: string
  other_links: string
}
const defaults: SettingsForm = {
  display_name: '', professional_title: '', avatar_text: 'TP',
  introduction: '', contact_email: '', github_url: '', other_links: '{}',
}
const errText = (e: unknown) => e instanceof Error ? e.message : String((e as {message?: string})?.message ?? '操作失败')

export function SettingsManager() {
  const [form, setForm] = useState<SettingsForm>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase 尚未配置。'); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle()
      if (error) throw error
      if (!data) throw new Error('site_settings 中没有 id = main 的站点配置记录。')
      setForm({
        display_name: data.display_name ?? '', professional_title: data.professional_title ?? '',
        avatar_text: data.avatar_text ?? 'TP', introduction: data.introduction ?? '',
        contact_email: data.contact_email ?? '', github_url: data.github_url ?? '',
        other_links: JSON.stringify(data.other_links ?? {}, null, 2),
      })
    } catch (e) { setError(errText(e)) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm(old => ({ ...old, [key]: value }))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || saving) return
    let links: Record<string, unknown>
    try {
      const parsed: unknown = JSON.parse(form.other_links || '{}')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('社交链接必须是 JSON 对象。')
      links = parsed as Record<string, unknown>
    } catch (e) { setError(`社交链接 JSON 格式错误：${errText(e)}`); return }
    setSaving(true); setError(''); setNotice('')
    try {
      const payload = {
        id: 'main', display_name: form.display_name.trim(),
        professional_title: form.professional_title.trim(),
        avatar_text: form.avatar_text.trim() || 'TP',
        introduction: form.introduction.trim(),
        contact_email: form.contact_email.trim() || null,
        github_url: form.github_url.trim() || null,
        other_links: links,
      }
      const { error } = await supabase.from('site_settings').upsert(payload, { onConflict: 'id' })
      if (error) throw error
      setNotice('网站设置已保存。首页的名称、职业头衔和介绍会自动更新。')
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setSaving(false) }
  }

  return (
    <div className="am-module">
      <div className="am-heading">
        <div><span className="am-eyebrow">PERSONAL HUB / CONFIGURATION</span><h1>网站设置</h1><p>维护首页展示的个人资料、介绍和联系方式。</p></div>
        <button className="am-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/>重新读取</button>
      </div>
      {error && <div className="am-notice error">{error}</div>}
      {notice && <div className="am-notice success">{notice}</div>}
      <section className="am-panel">
        {loading ? <div className="am-empty">正在读取网站配置…</div> :
          <form onSubmit={save}>
            <div className="am-panel-heading"><div><h2>首页个人资料</h2><p>对应 Supabase site_settings 表中的 main 记录。</p></div></div>
            <div className="am-form-grid">
              <label className="am-field"><span>展示名称</span><input value={form.display_name} onChange={e => set('display_name', e.target.value)} required maxLength={80}/></label>
              <label className="am-field"><span>职业头衔</span><input value={form.professional_title} onChange={e => set('professional_title', e.target.value)} placeholder="AI Engineer & Developer"/></label>
              <label className="am-field"><span>头像文字标识</span><input value={form.avatar_text} onChange={e => set('avatar_text', e.target.value)} maxLength={8} placeholder="TP"/></label>
              <label className="am-field"><span>联系邮箱</span><input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="name@example.com"/></label>
              <label className="am-field am-full"><span>个人介绍</span><textarea rows={5} value={form.introduction} onChange={e => set('introduction', e.target.value)} placeholder="介绍你的研究方向、技术兴趣和个人特点…"/></label>
              <label className="am-field am-full"><span>GitHub 地址</span><input type="url" value={form.github_url} onChange={e => set('github_url', e.target.value)} placeholder="https://github.com/username"/></label>
              <label className="am-field am-full"><span>其他社交链接（JSON）</span><textarea rows={6} value={form.other_links} onChange={e => set('other_links', e.target.value)} spellCheck={false}/><small>例如：{"{ \"Google Scholar\": \"https://scholar.google.com/\", \"ORCID\": \"https://orcid.org/\" }"}</small></label>
            </div>
            <div className="am-form-actions"><button type="submit" className="am-primary" disabled={saving}><Save size={15}/>{saving ? '保存中…' : '保存网站设置'}</button></div>
          </form>
        }
      </section>
    </div>
  )
}
