import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 使用 BrowserRouter + Netlify SPA fallback，资源路径固定从站点根目录解析。
  base: '/',
})
