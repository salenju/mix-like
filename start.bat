@echo off
chcp 65001 >nul
echo 🚀 启动 Mix-Like 排列组合工具
echo.

REM 检查并安装后端依赖
if not exist "backend\node_modules" (
  echo 📦 安装后端依赖...
  cd backend
  call npm install
  cd ..
)

REM 检查并安装前端依赖
if not exist "frontend\node_modules" (
  echo 📦 安装前端依赖...
  cd frontend
  call npm install
  cd ..
)

echo.
echo ✅ 依赖检查完成
echo.

REM 启动后端服务
echo 🔧 启动后端服务 (端口: 3002)...
cd backend
start "Mix-Like Backend" cmd /k npm start
cd ..

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo 🎨 启动前端服务 (端口: 5174)...
cd frontend
start "Mix-Like Frontend" cmd /k npm run dev
cd ..

echo.
echo ✨ Mix-Like 已启动！
echo.
echo 📍 后端地址: http://localhost:3002
echo 📍 前端地址: http://localhost:5174
echo.
echo 提示: 关闭对应的命令行窗口可停止服务
echo.
pause
