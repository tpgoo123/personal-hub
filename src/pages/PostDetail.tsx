import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Heart, Send } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { dateOf, summaryOf, titleOf, type ContentRow } from '../lib/content'
import { MarkdownPreview } from '../components/MarkdownPreview'

export function PostDetail() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState<ContentRow | null>(null)
  const [comments, setComments] = useState<ContentRow[]>([])
  const [replies, setReplies] = useState<ContentRow[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [commentBusy, setCommentBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    if (!supabase) {
      setPost(null)
      setComments([])
      setReplies([])
      setLoading(false)
      setLoadError('尚未连接 Supabase，暂时无法读取文章。')
      return
    }

    try {
      const client = supabase
      const { data: postData, error: postError } = await client
        .from('posts').select('*').eq('id', id).eq('status', 'published').maybeSingle()
      if (postError) throw postError
      setPost(postData)

      if (!postData) {
        setComments([])
        setReplies([])
        setIsFavorite(false)
        return
      }

      const { data: commentData, error: commentError } = await client
        .from('comments').select('*').eq('post_id', id).eq('status', 'approved')
        .order('created_at', { ascending: true })
      if (commentError) {
        console.warn('读取文章评论失败：', commentError.message)
        setNotice('文章已加载，但评论暂时无法读取。')
      }
      const approvedComments = commentData ?? []
      setComments(approvedComments)

      if (approvedComments.length) {
        const { data: replyData, error: replyError } = await client
          .from('comment_replies').select('*')
          .in('comment_id', approvedComments.map(item => item.id))
          .order('created_at', { ascending: true })
        if (replyError) {
          console.warn('读取管理员回复失败：', replyError.message)
          setReplies([])
        } else {
          setReplies(replyData ?? [])
        }
      } else {
        setReplies([])
      }

      if (user) {
        const { data: favoriteData, error: favoriteError } = await client
          .from('post_favorites').select('id').eq('user_id', user.id).eq('post_id', id).maybeSingle()
        if (favoriteError) {
          console.warn('读取文章收藏状态失败：', favoriteError.message)
          setIsFavorite(false)
        } else {
          setIsFavorite(Boolean(favoriteData))
        }
      } else {
        setIsFavorite(false)
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '文章加载失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => { void load() }, [load])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !supabase) {
      setNotice('请先登录后再发表评论。')
      return
    }
    if (!comment.trim() || commentBusy) return

    setCommentBusy(true)
    setNotice('')
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: id,
        user_id: user.id,
        content: comment.trim(),
        status: 'pending',
      })
      if (error) throw error
      setComment('')
      setNotice('评论已提交，管理员审核通过后将公开显示。')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '评论提交失败。')
    } finally {
      setCommentBusy(false)
    }
  }

  async function toggleFavorite() {
    if (!user || !supabase) {
      setNotice('请先登录后再收藏文章。')
      return
    }
    if (favoriteBusy) return

    setFavoriteBusy(true)
    setNotice('')
    try {
      if (isFavorite) {
        const { error } = await supabase.from('post_favorites')
          .delete().eq('user_id', user.id).eq('post_id', id)
        if (error) throw error
        setIsFavorite(false)
        setNotice('已取消收藏。')
      } else {
        const { error } = await supabase.from('post_favorites')
          .insert({ user_id: user.id, post_id: id })
        if (error) throw error
        setIsFavorite(true)
        setNotice('已加入收藏。')
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '收藏操作失败。')
    } finally {
      setFavoriteBusy(false)
    }
  }

  return (
    <SiteLayout>
      <section className="article-wrap container">
        <Link to="/posts" className="back-link"><ArrowLeft size={14}/> 返回文章列表</Link>
        {loading ? (
          <div className="empty-state">正在加载文章…</div>
        ) : loadError ? (
          <div className="empty-state error-state">{loadError}</div>
        ) : !post ? (
          <div className="empty-state"><strong>文章不存在或尚未公开</strong><Link to="/posts" className="text-link">返回文章列表</Link></div>
        ) : (
          <>
            <span className="eyebrow">PERSONAL HUB / ARTICLE</span>
            <h1 className="article-title">{titleOf(post)}</h1>
            <p className="article-summary">{summaryOf(post)}</p>
            <div className="article-meta">
              {dateOf(post) && <span><CalendarDays size={14}/>{dateOf(post).slice(0, 10)}</span>}
              {post.category && <span>{String(post.category)}</span>}
              {Array.isArray(post.tags) && post.tags.map((tag: string) => <span key={tag}>{tag}</span>)}
            </div>
            <div className="article-actions">
              <button className={`button-outline ${isFavorite ? 'is-favorite' : ''}`} onClick={() => void toggleFavorite()} disabled={favoriteBusy}>
                <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'}/>
                {favoriteBusy ? '处理中…' : isFavorite ? '已收藏 · 取消收藏' : '收藏文章'}
              </button>
            </div>
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
              {user ? (
                <form className="comment-form" onSubmit={submitComment}>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="写下你的想法…" rows={3} maxLength={3000}/>
                  <button className="button-primary" disabled={commentBusy || !comment.trim()}>
                    {commentBusy ? '提交中…' : '提交评论'} <Send size={14}/>
                  </button>
                </form>
              ) : (
                <p className="muted">登录后可以发表评论。<Link to="/login">去登录</Link></p>
              )}
              {notice && <div className="form-message">{notice}</div>}
            </section>
          </>
        )}
      </section>
    </SiteLayout>
  )
}
