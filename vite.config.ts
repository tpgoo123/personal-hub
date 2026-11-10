import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // HashRouter 让 GitHub Pages 子路径部署和页面刷新更简单
  base: './',
})
