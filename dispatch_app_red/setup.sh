#!/usr/bin/env bash
set -e

# 1. Install all npm dependencies (including AOS, Three.js)
npm ci

# 2. Code quality checks (will stop on error)
npm run lint
npm run format

# 3. Build front‑end assets with Vite (produces ./dist, gzip & brotli files)
npm run vite-build

# 4. Build and start Docker containers (Express + Redis)
#    - Make sure Docker Desktop/engine is running
docker compose up --build -d

# 5. Final message
echo "✅ Setup 完成"
echo "前端資源已建置於 ./dist"
echo "後端服務已在 http://localhost:3000 供應"
echo "AOS、Three.js 已自動加入，滾動與背景粒子即時生效"
