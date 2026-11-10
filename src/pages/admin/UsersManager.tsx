import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, RefreshCw, Save, Search, ShieldCheck, UserX, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './AdminModules.css'

type UserRow = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  display_name: string
  avatar_url: string | null
  bio: string
  role: 'user' | 'admin'
}
const errText = (e: unknown) => e instanceof Error ? e.message : String((e as {message?: string})?.message ?? '操作失败')
const dateText = (v: string | null) => v ? new Date(v).toLocaleDateString('zh-CN') : '—'
const isBanned = (v: string | null) => Boolean(v && new Date(v).getTime() > Date.now())

export function UsersManager() {
  const { user: currentUser } = useAuth()
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [duration, setDuration] = useState('168h')
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editBio, setEditBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const invoke = useCallback(async (body: Record<string, unknown>) => {
    if (!supabase) throw new Error('Supabase 尚未配置。')
    const { data, error } = await supabase.functions.invoke('admin-users', { body })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await invoke({ action: 'list' })
      setRows((data?.users ?? []) as UserRow[])
    } catch (e) {
      setError(`${errText(e)}。请确认已部署 supabase/functions/admin-users，并执行配套数据库迁移。`)
    } finally { setLoading(false) }
  }, [invoke])
  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(row => {
      const banned = isBanned(row.banned_until)
      const ok = filter === 'all' || (filter === 'admin' && row.role === 'admin') ||
        (filter === 'user' && row.role === 'user') || (filter === 'banned' && banned)
      return ok && (!q || [row.email ?? '', row.display_name, row.id].join(' ').toLowerCase().includes(q))
    })
  }, [rows, search, filter])


  function openProfileEdit(row: UserRow) {
    setEditingUser(row)
    setEditName(row.display_name ?? '')
    setEditAvatar(row.avatar_url ?? '')
    setEditBio(row.bio ?? '')
    setError('')
    setNotice('')
  }

  async function saveProfile() {
    if (!supabase || !editingUser || savingProfile) return
    if (!editName.trim()) { setError('用户昵称不能为空。'); return }
    setSavingProfile(true); setError(''); setNotice('')
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: editName.trim(),
        avatar_url: editAvatar.trim() || null,
        bio: editBio.trim(),
      }).eq('id', editingUser.id)
      if (error) throw error
      setNotice('用户资料已更新。')
      setEditingUser(null)
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setSavingProfile(false) }
  }

  async function updateRole(row: UserRow, role: 'user' | 'admin') {
    if (row.role === role || busyId) return
    if (row.id === currentUser?.id && role === 'user') { setError('不能在当前登录会话中移除自己的管理员权限。'); return }
    const actionText = role === 'admin' ? '授予管理员权限' : '取消管理员权限'
    if (!window.confirm(`确定对 ${row.email ?? row.id} 执行「${actionText}」吗？`)) return
    setBusyId(row.id); setError(''); setNotice('')
    try {
      await invoke({ action: 'set-role', user_id: row.id, role })
      setNotice(`${row.email ?? '用户'}的角色已更新为${role === 'admin' ? '管理员' : '普通用户'}。`)
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  async function toggleBan(row: UserRow) {
    if (busyId) return
    const banned = isBanned(row.banned_until)
    if (row.id === currentUser?.id) { setError('不能封禁当前登录的管理员账号。'); return }
    if (!banned && !window.confirm(`确定封禁用户 ${row.email ?? row.id}，时长 ${duration} 吗？`)) return
    setBusyId(row.id); setError(''); setNotice('')
    try {
      await invoke({ action: banned ? 'unban' : 'ban', user_id: row.id, duration })
      setNotice(banned ? '用户已解封。' : '用户已封禁。')
      await load()
    } catch (e) { setError(errText(e)) }
    finally { setBusyId(null) }
  }

  const admins = rows.filter(x => x.role === 'admin').length
  const banned = rows.filter(x => isBanned(x.banned_until)).length

  return (
    <div className="am-module">
      <div className="am-heading">
        <div><span className="am-eyebrow">PERSONAL HUB / ACCOUNTS</span><h1>用户管理</h1><p>查看注册账号、管理用户角色，并通过安全服务端接口封禁或解封账号。</p></div>
        <button className="am-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/>刷新用户</button>
      </div>
      <div className="am-stats">
        <div className="am-stat"><span>注册用户</span><strong>{rows.length}</strong></div>
        <div className="am-stat"><span>管理员</span><strong>{admins}</strong></div>
        <div className="am-stat"><span>已封禁</span><strong>{banned}</strong></div>
        <div className="am-stat"><span>当前筛选结果</span><strong>{filtered.length}</strong></div>
      </div>
      {error && <div className="am-notice error">{error}</div>}
      {notice && <div className="am-notice success">{notice}</div>}
      <div className="am-notice info">用户列表由 Supabase Auth Admin API 提供；角色变更和封禁操作在 Edge Function 服务端执行，浏览器不会接触 service_role 密钥。</div>
      {editingUser && (
        <section className="am-editor">
          <div className="am-editor-head">
            <div><h2>编辑用户资料</h2><p>{editingUser.email || editingUser.id}</p></div>
            <button className="am-icon" type="button" onClick={() => setEditingUser(null)}><X size={15}/></button>
          </div>
          <div className="am-form-grid">
            <label className="am-field"><span>昵称</span><input value={editName} onChange={e => setEditName(e.target.value)} maxLength={80}/></label>
            <label className="am-field"><span>头像 URL</span><input type="url" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="https://..."/></label>
            <label className="am-field am-full"><span>个人简介</span><textarea rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={500}/></label>
          </div>
          <div className="am-form-actions">
            <button className="am-secondary" onClick={() => setEditingUser(null)} disabled={savingProfile}>取消</button>
            <button className="am-primary" onClick={() => void saveProfile()} disabled={savingProfile}><Save size={14}/>{savingProfile ? '保存中…' : '保存用户资料'}</button>
          </div>
        </section>
      )}
      <div className="am-toolbar">
        <div className="am-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索邮箱、昵称或用户 ID"/></div>
        <select className="am-select" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">全部用户</option><option value="admin">管理员</option><option value="user">普通用户</option><option value="banned">已封禁</option></select>
        <select className="am-select" value={duration} onChange={e => setDuration(e.target.value)}><option value="24h">封禁 24 小时</option><option value="168h">封禁 7 天</option><option value="720h">封禁 30 天</option></select>
      </div>
      <div className="am-table-wrap">
        <table className="am-table">
          <thead><tr><th>用户</th><th>角色</th><th>注册时间</th><th>最近登录</th><th>账号状态</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="am-empty">正在读取用户列表…</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="am-empty">没有符合条件的用户。</td></tr> :
              filtered.map(row => {
                const bannedNow = isBanned(row.banned_until)
                const self = row.id === currentUser?.id
                return <tr key={row.id}>
                  <td><div className="am-user-cell"><div className="am-avatar">{(row.display_name || row.email || 'U').slice(0,1).toUpperCase()}</div><div className="am-title-cell">{row.display_name || '未设置昵称'}<span className="am-subtext">{row.email || row.id}</span></div></div></td>
                  <td><span className={`am-badge ${row.role === 'admin' ? 'approved' : ''}`}>{row.role === 'admin' ? '管理员' : '普通用户'}</span></td>
                  <td>{dateText(row.created_at)}</td><td>{dateText(row.last_sign_in_at)}</td>
                  <td><span className={`am-badge ${bannedNow ? 'banned' : 'active'}`}>{bannedNow ? `封禁至 ${new Date(row.banned_until!).toLocaleDateString('zh-CN')}` : '正常'}</span></td>
                  <td><div className="am-row-actions">
                    <button className="am-icon" title="编辑用户资料" onClick={() => openProfileEdit(row)}><Pencil size={13}/></button>
                    <select className="am-select" value={row.role} disabled={busyId === row.id || self} onChange={e => void updateRole(row, e.target.value as 'user' | 'admin')} aria-label="修改用户角色"><option value="user">普通用户</option><option value="admin">管理员</option></select>
                    <button className={bannedNow ? 'am-secondary' : 'am-danger'} disabled={busyId === row.id || self} onClick={() => void toggleBan(row)} title={self ? '不能操作当前账号' : bannedNow ? '解封用户' : '封禁用户'}>{bannedNow ? <ShieldCheck size={13}/> : <UserX size={13} />}{bannedNow ? '解封' : '封禁'}</button>
                  </div></td>
                </tr>
              })
            }
          </tbody>
        </table>
      </div>
      <p className="am-muted" style={{marginTop:12}}>管理员角色变更会同步 user_roles；为避免误操作，当前登录账号不可自行降权或封禁。</p>
    </div>
  )
}
