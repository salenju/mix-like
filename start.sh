#!/bin/bash

echo "🚀 启动 Mix-Like 排列组合工具"
echo ""

# 检查并安装后端依赖
if [ ! -d "backend/node_modules" ]; then
  echo "📦 安装后端依赖..."
  cd backend
  npm install
  cd ..
fi

# 检查并安装前端依赖
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 安装前端依赖..."
  cd frontend
  npm install
  cd ..
fi

echo ""
echo "✅ 依赖检查完成"
echo ""

# 启动后端服务
echo "🔧 启动后端服务 (端口: 3002)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务 (端口: 5174)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✨ Mix-Like 已启动！"
echo ""
echo "📍 后端地址: http://localhost:3002"
echo "📍 前端地址: http://localhost:5174"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 捕获中断信号
trap "echo ''; echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 等待
wait
