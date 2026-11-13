# =====================================================================
# Dockerfile cho ITJobs Backend (Express.js + ES Modules)
# Multi-stage build: stage "deps" cài dependencies, stage "runtime" chỉ
# copy node_modules production => image nhỏ, không chứa devDependencies.
# =====================================================================

# ---------- Stage 1: Cài dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy riêng file manifest trước để tận dụng cache layer của Docker
# (chỉ cài lại npm khi package.json / package-lock.json thay đổi)
COPY package.json package-lock.json ./

# npm ci: cài chính xác theo package-lock.json, nhanh và tái lập được
RUN npm ci --omit=dev && npm cache clean --force


# ---------- Stage 2: Runtime ----------
FROM node:22-alpine AS runtime

# dumb-init để xử lý signal (SIGTERM/SIGINT) đúng cách khi docker stop
RUN apk add --no-cache dumb-init

# Chạy bằng user không phải root cho an toàn
ENV NODE_ENV=production \
    PORT=4000 \
    TZ=Asia/Ho_Chi_Minh

WORKDIR /app

# Copy node_modules đã build ở stage deps
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy toàn bộ source code (đã lọc bởi .dockerignore)
COPY --chown=node:node . .

USER node

EXPOSE 4000

# Healthcheck: gọi vào cổng server, chấp nhận 2xx/3xx/404 (server vẫn sống)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

# dumb-init làm PID 1 để forward signal xuống node
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "index.js"]
