# LUMEN 前端生产镜像（⑪ 部署方案 A）：Vite build → Nginx 静态托管 + /api 反代后端
# 构建：docker build -f frontend/Dockerfile -t lumen-frontend .
# 运行：docker compose -f docker/docker-compose.prod.yml up -d（推荐）

# 构建阶段：Node 22（与前端锁定版本一致，见 frontend/package.json volta.node）
FROM node:22-slim AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# DEMO_BACKEND_PROXY_URL 仅 dev server 用，生产由 Nginx 反代，无需注入
RUN npm run build

# 运行阶段：Nginx 托管 dist + 反代 /api 到后端
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# 默认后端地址 = compose 服务名 backend:8000；可用环境变量覆盖
ENV LUMEN_BACKEND_URL=http://backend:8000
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${LUMEN_BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
