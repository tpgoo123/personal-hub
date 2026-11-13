import { useEffect, useState, type FormEvent } from 'react'
import { Heart, MessageCircle, Send, UserRound, Save, ShieldCheck } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export function Account() {
  const { user, isAdmin } = useAuth()
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [favorites, setFavorites] = useState(0)
  const [comments, setComments] = useState(0)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      setLoading(true)
      try {
        const client = supabase!
        const [profileResult, projectFavorites, postFavorites, commentResult] = await Promise.all([
          client.from('profiles').select('*').eq('id', user!.id).maybeSingle(),
          client.from('project_favorites').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
          client.from('post_favorites').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
          client.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        ])

        if (profileResult.error) throw profileResult.error
        if (projectFavorites.error) throw projectFavorites.error
        if (postFavorites.error) throw postFavorites.error
        if (commentResult.error) throw commentResult.error

        if (!active) return
        const profile = profileResult.data
        setNickname(profile?.display_name ?? user!.user_metadata?.display_name ?? user!.email?.split('@')[0] ?? '')
        setBio(profile?.bio ?? '')
        setAvatar(profile?.avatar_url ?? '')
        setFavorites((projectFavorites.count ?? 0) + (postFavorites.count ?? 0))
        setComments(commentResult.count ?? 0)
      } catch (error) {
        if (!active) return
        setNotice(error instanceof Error ? error.message : '个人资料读取失败，请稍后重试。')
        setNoticeType('error')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [user])

  function showNotice(text: string, type: 'success' | 'error' = 'success') {
    setNotice(text)
    setNoticeType(type)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !supabase || saving) return
    if (!nickname.trim()) {
      showNotice('昵称不能为空。', 'error')
      return
    }

    setSaving(true)
    setNotice('')
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: nickname.trim(),
        avatar_url: avatar.trim() || null,
        bio: bio.trim(),
      }, { onConflict: 'id' })
      if (error) throw error
      showNotice('个人资料已保存。')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : '个人资料保存失败。', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !supabase || sending) return
    if (!subject.trim() || !message.trim()) {
      showNotice('请填写留言主题和内容。', 'error')
      return
    }

    setSending(true)
    setNotice('')
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        subject: subject.trim(),
        content: message.trim(),
        status: 'new',
      })
      if (error) throw error
      setSubject('')
      setMessage('')
      showNotice('留言已发送，管理员回复后可在后续版本查看处理进度。')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : '留言发送失败，请稍后重试。', 'error')
    } finally {
      setSending(false)
    }
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
          <div className="account-avatar">
            {avatar ? <img src={avatar} alt="个人头像"/> : (nickname || user?.email || 'U').slice(0, 1).toUpperCase()}
          </div>
          <h2>{nickname || '新用户'}</h2>
          <p>{user?.email}</p>
          {isAdmin && <span className="account-role"><ShieldCheck size={13}/> 网站管理员</span>}
          <div className="account-stats">
            <span><Heart size={15}/>{favorites} 收藏</span>
            <span><MessageCircle size={15}/>{comments} 评论</span>
          </div>
          <Link to="/" className="text-link">返回公开网站 <span aria-hidden="true">→</span></Link>
          {isAdmin && <Link to="/admin" className="account-admin-link"><ShieldCheck size={14}/> 进入管理后台</Link>}
        </aside>

        <div className="account-main">
          {loading && <div className="panel account-loading">正在读取个人资料与互动记录…</div>}

          <section className="panel">
            <div className="panel-heading">
              <div><span className="eyebrow">PROFILE</span><h2>个人资料</h2></div>
              <UserRound/>
            </div>
            <form className="form-stack" onSubmit={saveProfile}>
              <label>昵称<input className="text-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="你的昵称" maxLength={80} required/></label>
              <label>头像图片 URL<input className="text-input" type="url" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…"/></label>
              <label>个人简介<textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="简单介绍一下自己…" maxLength={500}/></label>
              <button className="button-primary" disabled={saving || loading}>
                <Save size={15}/>{saving ? '保存中…' : '保存资料'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">CONTACT</span><h2>给管理员留言</h2></div><Send/></div>
            <form className="form-stack" onSubmit={sendMessage}>
              <label>主题<input className="text-input" value={subject} onChange={e => setSubject(e.target.value)} required maxLength={120} placeholder="留言主题"/></label>
              <label>留言内容<textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} required maxLength={3000} placeholder="请输入留言内容…"/></label>
              <button className="button-primary" disabled={sending || loading}>
                <Send size={15}/>{sending ? '发送中…' : '发送留言'}
              </button>
            </form>
          </section>

          <section className="panel quick-links">
            <div className="panel-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>我的互动</h2></div></div>
            <Link to="/projects">浏览项目并收藏 <span>→</span></Link>
            <Link to="/posts">阅读文章并评论 <span>→</span></Link>
            <p className="muted">收藏与评论统计会根据当前账号的互动记录更新。</p>
          </section>

          {notice && <div className={`form-message ${noticeType}`}>{notice}</div>}
        </div>
      </section>
    </SiteLayout>
  )
}
