import { AlertCircle } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

export function ConfigNotice() {
  if (isSupabaseConfigured) return null
  return (
    <div className="config-notice">
      <AlertCircle size={17}/>
      <div>
        <strong>尚未连接 Supabase</strong>
        <span>先复制 .env.example 为 .env.local，并填写 Supabase Project URL 与 Publishable / anon 公钥。</span>
      </div>
    </div>
  )
}
