import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, MessageSquare, RefreshCw, Send, Trash2, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './AdminModules.css'

type CommentRow = {
  id: string; post_id: string; user_id: string; author_name: string
  content: string; status: 'pending' | 'approved' | 'rejected'; created_at: string
}
type MessageRow = {
  id: string; sender_id: string; subject: string; content: string
  status: 'new' | 'processing' | 'replied' | 'closed'
  admin_reply: string | null; replied_at: string | null; created_at: string
}
type ReplyRow = { id: string; comment_id: string; author_name: string; content: string; created_at: string }
const errText = (e: unknown) => e instanceof Error ? e.message : String((e as {message?: string})?.message ?? '操作失败')
const dateText = (v: string) => new Date(v).toLocaleString('zh-CN')

export function CommentsManager() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'comments' | 'messages'>('comments')
  const [comments, setComments] = useState<CommentRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [replies, setReplies] = useState<ReplyRow[]>([])
  const [postNames, setPostNames] = useState<Record<string, string>>({})
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase 尚未配置。'); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const [c, m, p, profiles] = await Promise.all([
        supabase.from('comments').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('id,title'),
        supabase.from('profiles').select('id,display_name'),
      ])
      if (c.error) throw c.error
      if (m.error) throw m.error
      if (p.error) throw p.error
      if (profiles.error) throw profiles.error
      const commentRows = (c.data ?? []) as CommentRow[]
      setComments(commentRows)
      setMessages((m.data ?? []) as MessageRow[])
      setPostNames(Object.fromEntries((p.data ?? []).map(x => [x.id, x.title])))
      setProfileNames(Object.fromEntries((profiles.data ?? []).map(x => [x.id, x.display_name || '用户'])))
      if (commentRows.length) {
        const r = await supabase.from('comment_replies').select('*').in('comment_id', commentRows.map(x => x.id)).order('created_at', { ascending: true })
        if (r.error) {
          setReplies([])
          if (r.error.code !== '42P01') throw new Error(`评论回复表不可用：${r.error.message}。请先执行项目附带的数据库迁移 SQL。`)
        } else setReplies((r.data ?? []) as ReplyRow[])
      } else setReplies([])
    } catch (e) { setError(errText(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const visibleComments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return comments.filter(row => (filter === 'all' || row.status === filter) &&
      (!q || [row.author_name, row.content, postNames[row.post_id] ?? ''].join(' ').toLowerCase().includes(q)))
  }, [comments, filter, search, postNames])
  const visibleMessages = useMemo(() => {
    const q = search.trim().toLowerCase()
    return messages.filter(row => (filter === 'all' || row.status === filter) &&
      (!q || [row.subject, row.content, row.admin_reply ?? '', profileNames[row.sender_id] ?? ''].join(' ').toLowerCase().includes(q)))
  }, [messages, filter, search, profileNames])

  async function updateComment(row: CommentRow, status: CommentRow['status']) {
    if (!supabase || busyId) return
    setBusyId(row.id); setError(''); setNotice('')
    try {
      const { error } = await supabase.from('comments').update({ status }).eq('id', row.id)
      if (error) throw error
      setNotice(status === 'approved' ? '评论已通过审核。' : '评论状态已更新。')
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  async function deleteComment(row: CommentRow) {
    if (!supabase || busyId) return
    if (!window.confirm('确定删除这条评论吗？相关回复也会一并删除。')) return
    setBusyId(row.id); setError('')
    try {
      const { error } = await supabase.from('comments').delete().eq('id', row.id)
      if (error) throw error
      setNotice('评论已删除。'); await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  async function sendReply(event: FormEvent, row: CommentRow) {
    event.preventDefault()
    if (!supabase || !user) return
    const content = (replyDrafts[row.id] ?? '').trim()
    if (!content) return
    setBusyId(row.id); setError('')
    try {
      const { error } = await supabase.from('comment_replies').insert({
        comment_id: row.id, user_id: user.id, author_name: '网站管理员', content,
      })
      if (error) throw error
      setReplyDrafts(old => ({ ...old, [row.id]: '' }))
      setReplyOpen(null); setNotice('管理员回复已发布。'); await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  async function replyMessage(event: FormEvent, row: MessageRow) {
    event.preventDefault()
    if (!supabase) return
    const reply = (messageDrafts[row.id] ?? '').trim()
    if (!reply) return
    setBusyId(row.id); setError('')
    try {
      const { error } = await supabase.from('messages').update({
        admin_reply: reply, replied_at: new Date().toISOString(), status: 'replied',
      }).eq('id', row.id)
      if (error) throw error
      setNotice('留言回复已发送并保存。')
      setMessageDrafts(old => ({ ...old, [row.id]: '' }))
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  async function updateMessageStatus(row: MessageRow, status: MessageRow['status']) {
    if (!supabase) return
    setBusyId(row.id); setError('')
    try {
      const { error } = await supabase.from('messages').update({ status }).eq('id', row.id)
      if (error) throw error
      setNotice('留言状态已更新。'); await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  async function deleteMessage(row: MessageRow) {
    if (!supabase || !window.confirm('确定删除这条用户留言吗？')) return
    setBusyId(row.id)
    try {
      const { error } = await supabase.from('messages').delete().eq('id', row.id)
      if (error) throw error
      setNotice('留言已删除。'); await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  const pending = comments.filter(x => x.status === 'pending').length
  const newMessages = messages.filter(x => x.status === 'new').length

  return (
    <div className="am-module">
      <div className="am-heading">
        <div><span className="am-eyebrow">PERSONAL HUB / COMMUNITY</span><h1>评论与留言</h1><p>审核访客评论、发布管理员回复，并处理用户通过个人中心发送的留言。</p></div>
        <button className="am-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/>刷新</button>
      </div>
      <div className="am-stats">
        <div className="am-stat"><span>全部评论</span><strong>{comments.length}</strong></div>
        <div className="am-stat"><span>待审核</span><strong>{pending}</strong></div>
        <div className="am-stat"><span>全部留言</span><strong>{messages.length}</strong></div>
        <div className="am-stat"><span>新留言</span><strong>{newMessages}</strong></div>
      </div>
      {error && <div className="am-notice error">{error}</div>}
      {notice && <div className="am-notice success">{notice}</div>}
      <div className="am-inline-tabs">
        <button className={`am-tab ${tab === 'comments' ? 'active' : ''}`} onClick={() => { setTab('comments'); setFilter('all') }}>评论审核（{pending} 待处理）</button>
        <button className={`am-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => { setTab('messages'); setFilter('all') }}>用户留言（{newMessages} 未读）</button>
      </div>
      <div className="am-toolbar">
        <div className="am-search"><MessageSquare size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索评论、文章、留言或用户"/></div>
        {tab === 'comments' ?
          <select className="am-select" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">全部状态</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已拒绝</option></select> :
          <select className="am-select" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">全部状态</option><option value="new">新留言</option><option value="processing">处理中</option><option value="replied">已回复</option><option value="closed">已关闭</option></select>}
      </div>

      {tab === 'comments' ? (
        <div className="am-panel">
          {loading ? <div className="am-empty">正在加载评论…</div> : visibleComments.length === 0 ? <div className="am-empty">暂无符合条件的评论。</div> :
            visibleComments.map(row => (
              <article key={row.id} style={{padding:'15px 0',borderBottom:'1px solid #edf0eb'}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div><strong style={{fontSize:12,color:'#344034'}}>{row.author_name || profileNames[row.user_id] || '用户'}</strong><span className="am-subtext">文章：{postNames[row.post_id] || '文章已删除'} · {dateText(row.created_at)}</span></div>
                  <span className={`am-badge ${row.status}`}>{row.status === 'pending' ? '待审核' : row.status === 'approved' ? '已通过' : '已拒绝'}</span>
                </div>
                <p style={{fontSize:12,lineHeight:1.8,color:'#596459',whiteSpace:'pre-wrap'}}>{row.content}</p>
                {replies.filter(r => r.comment_id === row.id).map(reply => <div key={reply.id} style={{margin:'8px 0 8px 18px',padding:'10px 12px',background:'#f5f8f3',borderRadius:7}}><strong style={{fontSize:10,color:'#58765b'}}>{reply.author_name}</strong><p style={{margin:'5px 0 0',fontSize:11,color:'#566456',whiteSpace:'pre-wrap'}}>{reply.content}</p></div>)}
                <div className="am-row-actions">
                  {row.status !== 'approved' && <button className="am-secondary" onClick={() => void updateComment(row, 'approved')} disabled={busyId === row.id}><Check size={13}/>通过</button>}
                  {row.status !== 'rejected' && <button className="am-secondary" onClick={() => void updateComment(row, 'rejected')} disabled={busyId === row.id}><XCircle size={13}/>拒绝</button>}
                  <button className="am-secondary" onClick={() => setReplyOpen(replyOpen === row.id ? null : row.id)}><Send size={13}/>回复</button>
                  <button className="am-danger" onClick={() => void deleteComment(row)} disabled={busyId === row.id}><Trash2 size={13}/>删除</button>
                </div>
                {replyOpen === row.id && <form onSubmit={e => void sendReply(e, row)} style={{display:'flex',gap:8,marginTop:10,alignItems:'flex-end'}}>
                  <label className="am-field" style={{flex:1}}><span>管理员回复</span><textarea rows={2} value={replyDrafts[row.id] ?? ''} onChange={e => setReplyDrafts(old => ({...old,[row.id]:e.target.value}))} required placeholder="输入回复内容…"/></label>
                  <button className="am-primary" type="submit" disabled={busyId === row.id}><Send size={13}/>发送</button>
                </form>}
              </article>
            ))
          }
        </div>
      ) : (
        <div className="am-panel">
          {loading ? <div className="am-empty">正在加载留言…</div> : visibleMessages.length === 0 ? <div className="am-empty">暂无符合条件的留言。</div> :
            visibleMessages.map(row => (
              <article key={row.id} style={{padding:'15px 0',borderBottom:'1px solid #edf0eb'}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div><strong style={{fontSize:12,color:'#344034'}}>{row.subject}</strong><span className="am-subtext">{profileNames[row.sender_id] || row.sender_id} · {dateText(row.created_at)}</span></div>
                  <span className={`am-badge ${row.status}`}>{({new:'新留言',processing:'处理中',replied:'已回复',closed:'已关闭'} as Record<string,string>)[row.status]}</span>
                </div>
                <p style={{fontSize:12,lineHeight:1.8,color:'#596459',whiteSpace:'pre-wrap'}}>{row.content}</p>
                {row.admin_reply && <div style={{padding:'10px 12px',background:'#f5f8f3',borderRadius:7,marginBottom:10}}><strong style={{fontSize:10,color:'#58765b'}}>管理员回复</strong><p style={{margin:'5px 0 0',fontSize:11,whiteSpace:'pre-wrap'}}>{row.admin_reply}</p></div>}
                <form onSubmit={e => void replyMessage(e, row)} style={{display:'flex',gap:8,alignItems:'flex-end'}}>
                  <label className="am-field" style={{flex:1}}><span>{row.admin_reply ? '更新回复' : '回复留言'}</span><textarea rows={2} value={messageDrafts[row.id] ?? ''} onChange={e => setMessageDrafts(old => ({...old,[row.id]:e.target.value}))} placeholder="输入回复内容…"/></label>
                  <button className="am-primary" type="submit" disabled={busyId === row.id || !(messageDrafts[row.id] ?? '').trim()}><Send size={13}/>发送</button>
                </form>
                <div className="am-row-actions" style={{marginTop:9}}>
                  <select className="am-select" value={row.status} onChange={e => void updateMessageStatus(row, e.target.value as MessageRow['status'])}><option value="new">新留言</option><option value="processing">处理中</option><option value="replied">已回复</option><option value="closed">已关闭</option></select>
                  <button className="am-danger" onClick={() => void deleteMessage(row)}><Trash2 size={13}/>删除留言</button>
                </div>
              </article>
            ))
          }
        </div>
      )}
    </div>
  )
}
