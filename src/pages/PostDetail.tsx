import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, Send } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { summaryOf, titleOf, type ContentRow } from '../lib/content'
import { MarkdownPreview } from '../components/MarkdownPreview'

export function PostDetail() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState<ContentRow | null>(null)
  const [comments, setComments] = useState<ContentRow[]>([])
  const [replies, setReplies] = useState<ContentRow[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    if (!supabase) { setLoading(false); return }
    const { data: postData, error } = await supabase.from('posts').select('*').eq('id', id).eq('status', 'published').maybeSingle()
    if (error) setNotice(error.message)
    setPost(postData)
    const { data: commentData } = await supabase.from('comments').select('*').eq('post_id', id).eq('status', 'approved').order('created_at', { ascending: true })
    const approvedComments = commentData ?? []
    setComments(approvedComments)
    if (approvedComments.length) {
      const { data: replyData, error: replyError } = await supabase
        .from('comment_replies').select('*')
        .in('comment_id', approvedComments.map(item => item.id))
        .order('created_at', { ascending: true })
      if (!replyError) setReplies(replyData ?? [])
      else setReplies([])
    } else {
      setReplies([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function submitComment(event: FormEvent) {
    event.preventDefault()
    if (!user || !supabase) { setNotice('请先登录后再发表评论。'); return }
    if (!comment.trim()) return
    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: comment.trim(),
      status: 'pending',
    })
    if (error) setNotice(error.message)
    else {
      setComment('')
      setNotice('评论已提交，管理员审核通过后将公开显示。')
      await load()
    }
  }

  async function favorite() {
    if (!user || !supabase) { setNotice('请先登录后再收藏文章。'); return }
    const { data: existing } = await supabase.from('post_favorites').select('*').eq('user_id', user.id).eq('post_id', id).maybeSingle()
    if (existing) {
      const { error } = await supabase.from('post_favorites').delete().eq('user_id', user.id).eq('post_id', id)
      setNotice(error ? error.message : '已取消收藏。')
    } else {
      const { error } = await supabase.from('post_favorites').insert({ user_id: user.id, post_id: id })
      setNotice(error ? error.message : '已加入收藏。')
    }
  }

  return (
    <SiteLayout>
      <section className="article-wrap container">
        <Link to="/posts" className="back-link"><ArrowLeft size={14}/> 返回文章列表</Link>
        {loading ? <div className="empty-state">正在加载文章…</div> : !post ? <div className="empty-state">文章不存在或尚未公开。</div> : <>
          <span className="eyebrow">PERSONAL HUB / ARTICLE</span>
          <h1 className="article-title">{titleOf(post)}</h1>
          <p className="article-summary">{summaryOf(post)}</p>
          <div className="article-actions"><button className="button-outline" onClick={favorite}><Heart size={15}/> 收藏文章</button></div>
          <article className="article-content">
            <MarkdownPreview value={String(post.body_markdown ?? post.content ?? post.body ?? post.markdown ?? post.article ?? '')} emptyText="本文暂无正文内容。" />
          </article>
          <section className="comments-panel">
            <h2>文章评论 <span>{comments.length}</span></h2>
            {comments.length ? comments.map((item, index) => (
              <div className="comment-item" key={item.id ?? index}>
                <strong>{item.author_name ?? item.user_name ?? item.nickname ?? '注册用户'}</strong>
                <p>{item.content}</p>
                {replies.filter(reply => reply.comment_id === item.id).map(reply => (
                  <div className="comment-reply" key={reply.id}>
                    <strong>{reply.author_name ?? '网站管理员'}</strong>
                    <p>{reply.content}</p>
                  </div>
                ))}
              </div>
            )) : <p className="muted">还没有通过审核的评论。</p>}
            {user ? <form className="comment-form" onSubmit={submitComment}><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="写下你的想法…" rows={3}/><button className="button-primary" disabled={!comment.trim()}>提交评论 <Send size={14}/></button></form> : <p className="muted">登录后可以发表评论。<Link to="/login">去登录</Link></p>}
            {notice && <div className="form-message">{notice}</div>}
          </section>
        </>}
      </section>
    </SiteLayout>
  )
}
