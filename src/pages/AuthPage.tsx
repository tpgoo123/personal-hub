import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, CheckCircle2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { SiteLayout } from '../components/SiteLayout'
import { ConfigNotice } from '../components/ConfigNotice'
import { supabase } from '../lib/supabase'

export function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!supabase) {
      setError('请先配置 Supabase 环境变量，具体方法见项目 README。')
      return
    }
    if (isRegister && password !== confirm) {
      setError('两次输入的密码不一致。')
      return
    }
    if (!isForgot && password.length < 8) {
      setError('密码至少需要 8 位。')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (authError) throw authError
        setMessage(data.session
          ? '注册成功，正在进入个人中心…'
          : '注册申请已提交。请检查邮箱并点击验证链接，然后返回网站登录。')
        if (data.session) navigate('/account', { replace: true })
      } else if (isForgot) {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (authError) throw authError
        setMessage('如果该邮箱已注册，系统会发送密码重置邮件，请检查收件箱。')
      } else {
        const { data: signInData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password })

        if (authError) throw authError

        if (!signInData.user) {
          throw new Error('登录成功，但未获取到用户信息。')
        }

        // 查询当前账号是否具有管理员角色
        const { data: adminRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id)
          .eq('role', 'admin')
          .maybeSingle()

        if (roleError) {
          throw new Error(
            `登录成功，但管理员权限验证失败：${roleError.message}`
          )
        }

        // 管理员进入后台，普通用户进入个人中心
        navigate(
          adminRole ? '/admin' : '/account',
          { replace: true }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SiteLayout>
      <ConfigNotice/>
      <section className="auth-wrap container">
        <div className="auth-aside">
          <span className="eyebrow">PERSONAL HUB / YOUR SPACE</span>
          <div className="auth-monogram">TP.</div>
          <h1>{isRegister ? '创建你的账号。' : isForgot ? '找回账号。' : '欢迎回来。'}</h1>
          <p>一个记录想法、作品与成长的个人数字空间。</p>
          <Link to="/" className="back-link"><ArrowLeft size={14}/> 返回网站首页</Link>
        </div>
        <div className="auth-panel">
          <span className="eyebrow">{isRegister ? 'CREATE ACCOUNT' : isForgot ? 'RESET PASSWORD' : 'WELCOME BACK'}</span>
          <h2>{isRegister ? '注册账号' : isForgot ? '重置密码' : '登录 Personal Hub'}</h2>
          <p className="muted">{isRegister ? '注册后即可收藏项目、评论文章并向管理员留言。' : isForgot ? '输入注册邮箱，我们会发送密码重置链接。' : '管理员登录后进入后台管理，普通用户进入个人中心。'}</p>
          <form onSubmit={handleSubmit} className="form-stack">
            <label>邮箱地址<div className="input-wrap"><Mail size={17}/><input type="email" required autoComplete="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)}/></div></label>
            {!isForgot && <label>密码<div className="input-wrap"><LockKeyhole size={17}/><input type="password" required minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="至少 8 位" value={password} onChange={e => setPassword(e.target.value)}/></div></label>}
            {isRegister && <label>确认密码<div className="input-wrap"><LockKeyhole size={17}/><input type="password" required minLength={8} autoComplete="new-password" placeholder="再次输入密码" value={confirm} onChange={e => setConfirm(e.target.value)}/></div></label>}
            {error && <div className="form-message error">{error}</div>}
            {message && <div className="form-message success"><CheckCircle2 size={16}/>{message}</div>}
            <button className="button-primary submit-button" disabled={loading}>
              {loading ? '请稍候…' : isRegister ? '创建账号' : isForgot ? '发送重置邮件' : '登录'} <ArrowUpRight size={16}/>
            </button>
          </form>
          <div className="auth-links">
            {mode === 'login' && <><Link to="/forgot-password">忘记密码？</Link><span>还没有账号？ <Link to="/register">立即注册</Link></span></>}
            {mode === 'register' && <span>已经有账号？ <Link to="/login">直接登录</Link></span>}
            {mode === 'forgot' && <span><Link to="/login">返回登录</Link></span>}
          </div>
          <div className="auth-privacy"><UserRound size={14}/> 注册用户只能管理自己的账号资料和互动内容。</div>
        </div>
      </section>
    </SiteLayout>
  )
}
