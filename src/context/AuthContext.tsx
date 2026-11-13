import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  isAdmin: boolean
  roleLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setRoleLoading(false)
      return
    }

    let active = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) console.error('读取登录状态失败：', error.message)
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  // 仅用于控制前台导航是否显示“管理后台”；真正的权限仍由 AdminRoute、
  // Supabase RLS 和 Edge Function 在访问时再次校验。
  useEffect(() => {
    let active = true
    const userId = session?.user?.id

    if (!userId || !supabase) {
      setIsAdmin(false)
      setRoleLoading(false)
      return
    }

    setRoleLoading(true)

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle()

        if (!active) return

        if (error) {
          console.error('读取管理员角色失败：', error.message)
          setIsAdmin(false)
        } else {
          setIsAdmin(data?.role === 'admin')
        }

        setRoleLoading(false)
      } catch (error: unknown) {
        if (!active) return

        console.error('读取管理员角色失败：', error)
        setIsAdmin(false)
        setRoleLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [session?.user?.id])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    isAdmin,
    roleLoading,
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setIsAdmin(false)
    },
  }), [session, loading, isAdmin, roleLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return value
}
