@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20 或更高版本：https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo 正在安装项目依赖，首次运行需要联网...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)
call npm run dev
pause
