# syntax=docker/dockerfile:1

# ---------- Estagio 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copiar apenas os manifestos primeiro para aproveitar o cache de camadas
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Codigo-fonte e configuracao do build
COPY . .

# BASE_PATH permite servir o app na raiz ("/") ou em um subpath (ex: "/ponto/")
ARG BASE_PATH=/
ENV BASE_PATH=${BASE_PATH}

# Variaveis do Supabase injetadas no build (front-end). A service_role NUNCA deve ir aqui.
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build:vps

# ---------- Estagio 2: servico ----------
FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
