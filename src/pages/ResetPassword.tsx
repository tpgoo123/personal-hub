import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteLayout } from '../components/SiteLayout'
import { supabase } from '../lib/supabase'

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8) { setError('密码至少需要 8 位。'); return }
    if (password !== confirm) { setError('两次输入的密码不一致。'); return }
    if (!supabase) { setError('尚未配置 Supabase。'); return }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) setError(updateError.message)
    else { setMessage('密码修改成功，请重新登录。'); setTimeout(() => navigate('/login'), 1200) }
  }

  return <SiteLayout><section className="auth-wrap container single-auth"><div className="auth-panel"><span className="eyebrow">RESET PASSWORD</span><h2>设置新密码</h2><form className="form-stack" onSubmit={submit}><label>新密码<input className="text-input" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)}/></label><label>确认新密码<input className="text-input" type="password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)}/></label>{error && <div className="form-message error">{error}</div>}{message && <div className="form-message success">{message}</div>}<button className="button-primary" disabled={loading}>{loading ? '保存中…' : '更新密码'}</button></form><p className="muted"><Link to="/login">返回登录</Link></p></div></section></SiteLayout>
}
