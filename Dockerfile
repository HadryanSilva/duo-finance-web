# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24.14.0-alpine AS builder

WORKDIR /app

# Copia manifests primeiro para aproveitar cache de camadas
COPY package.json package-lock.json ./
RUN npm ci

# Copia o restante do código
COPY . .

# VITE_API_URL aponta para a URL pública do backend em produção
# Passar em build time: docker build --build-arg VITE_API_URL=https://api.seudominio.com
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.29.5-alpine AS runner

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config customizada: suporte a Vue Router (history mode) + gzip + cache de assets
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia os arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]