import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function checkAdmin() {
      if (loading) return

      if (!user) {
        setIsAdmin(false)
        setError('')
        setChecking(false)
        return
      }

      if (!supabase) {
        setError('Supabase 尚未配置')
        setIsAdmin(false)
        setChecking(false)
        return
      }

      setChecking(true)
      setError('')

      try {
        const { data, error: queryError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!active) return

        if (queryError) {
          setError(queryError.message)
          setIsAdmin(false)
          return
        }

        setIsAdmin(data?.role === 'admin')
      } catch (err) {
        if (!active) return

        setError(
          err instanceof Error
            ? err.message
            : '管理员权限验证失败'
        )
        setIsAdmin(false)
      } finally {
        if (active) {
          setChecking(false)
        }
      }
    }

    void checkAdmin()

    return () => {
      active = false
    }
  }, [user, loading])

  if (loading || checking) {
    return (
      <div className="page-state">
        正在验证管理员权限…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (error) {
    return (
      <div className="page-state">
        <h2>权限验证失败</h2>
        <p>{error}</p>
        <Link to="/">返回首页</Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="page-state">
        <h2>无权访问</h2>
        <p>当前账号不是网站管理员。</p>
        <Link to="/">返回首页</Link>
      </div>
    )
  }

  return <>{children}</>
}