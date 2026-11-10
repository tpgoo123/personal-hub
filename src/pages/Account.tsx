import { useEffect, useState, type FormEvent } from 'react'
import { Heart, MessageCircle, Send, UserRound, Save } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export function Account() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [favorites, setFavorites] = useState(0)
  const [comments, setComments] = useState(0)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !supabase) return
    async function load() {
      const { data } = await supabase!.from('profiles').select('*').eq('id', user!.id).maybeSingle()
      if (data) {
        setProfile(data)
        setNickname(data.display_name ?? data.full_name ?? data.nickname ?? data.name ?? '')
        setBio(data.bio ?? data.introduction ?? data.about ?? '')
        setAvatar(data.avatar_url ?? data.avatar ?? '')
      }
      const [p, a, c] = await Promise.all([
        supabase!.from('project_favorites').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase!.from('post_favorites').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase!.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      ])
      setFavorites((p.count ?? 0) + (a.count ?? 0))
      setComments(c.count ?? 0)
    }
    load()
  }, [user])

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (!user || !supabase || !profile) {
      setNotice('暂时无法读取个人资料，请检查注册触发器是否已创建 profiles 记录。')
      return
    }
    const patch: Record<string, string> = {}
    const nameKey = ['display_name', 'full_name', 'nickname', 'name'].find(k => k in profile)
    const bioKey = ['bio', 'introduction', 'about'].find(k => k in profile)
    const avatarKey = ['avatar_url', 'avatar'].find(k => k in profile)
    if (nameKey) patch[nameKey] = nickname
    if (bioKey) patch[bioKey] = bio
    if (avatarKey) patch[avatarKey] = avatar
    if (!Object.keys(patch).length) {
      setNotice('当前 profiles 表字段与资料编辑表单尚未匹配，请先核对数据库字段。')
      return
    }
    setSaving(true)
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select('*').maybeSingle()
    setSaving(false)
    if (error) setNotice(error.message)
    else { setProfile(data); setNotice('个人资料已保存。') }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    if (!user || !supabase || !subject.trim() || !message.trim()) return
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      subject: subject.trim(),
      content: message.trim(),
      status: 'new',
    })
    setNotice(error ? error.message : '留言已发送。')
    if (!error) { setSubject(''); setMessage('') }
  }

  return (
    <SiteLayout>
      <section className="page-hero container">
        <span className="eyebrow">PERSONAL HUB / ACCOUNT</span>
        <h1>个人中心</h1>
        <p>管理个人资料、查看互动记录，并与网站管理员联系。</p>
      </section>
      <section className="account-grid container">
        <aside className="account-sidebar">
          <div className="account-avatar">{(nickname || user?.email || 'U').slice(0, 1).toUpperCase()}</div>
          <h2>{nickname || '新用户'}</h2>
          <p>{user?.email}</p>
          <div className="account-stats"><span><Heart size={15}/>{favorites} 收藏</span><span><MessageCircle size={15}/>{comments} 评论</span></div>
          <Link to="/" className="text-link">返回公开网站 →</Link>
        </aside>
        <div className="account-main">
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">PROFILE</span><h2>个人资料</h2></div><UserRound/></div>
            <form className="form-stack" onSubmit={saveProfile}>
              <label>昵称<input className="text-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="你的昵称"/></label>
              <label>头像图片 URL<input className="text-input" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…"/></label>
              <label>个人简介<textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="简单介绍一下自己…"/></label>
              <button className="button-primary" disabled={saving}><Save size={15}/>{saving ? '保存中…' : '保存资料'}</button>
            </form>
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">CONTACT</span><h2>给管理员留言</h2></div><Send/></div>
            <form className="form-stack" onSubmit={sendMessage}>
              <label>主题<input className="text-input" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="留言主题"/></label>
              <label>留言内容<textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} required placeholder="请输入留言内容…"/></label>
              <button className="button-primary"><Send size={15}/>发送留言</button>
            </form>
          </section>
          <section className="panel quick-links">
            <div className="panel-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>我的互动</h2></div></div>
            <Link to="/projects">浏览项目并收藏 <span>→</span></Link>
            <Link to="/posts">阅读文章并评论 <span>→</span></Link>
            <p className="muted">收藏与评论详情页将在下一轮交互模块中完善。</p>
          </section>
          {notice && <div className="form-message">{notice}</div>}
        </div>
      </section>
    </SiteLayout>
  )
}
