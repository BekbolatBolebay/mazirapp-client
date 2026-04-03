# Multi-stage Dockerfile for Next.js Standalone
FROM node:20-alpine AS base

# 1. Тәуелділіктерді (dependencies) орнату кезеңі
FROM base AS deps
# Next.js үшін қажетті libc6-compat кітапханасын орнату
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm-ді жаһандық деңгейде орнату (Next.js талап етіп жатқан соң)
RUN npm install -g pnpm

# Пакет файлдарын көшіру
ARG APP_DIR=food-app-build
COPY ${APP_DIR}/package.json ${APP_DIR}/package-lock.json* ./

# Ескерту: Егер npm ci қате бере берсе, оны "npm install" деп өзгертіңіз
RUN npm install || npm ci

# 2. Жобаны жинау (build) кезеңі
FROM base AS builder
WORKDIR /app
ARG APP_DIR=food-app-build

# Бұл кезеңде де pnpm қолжетімді болуы керек
RUN npm install -g pnpm

# Алдыңғы кезеңнен node_modules-ті көшіріп алу
COPY --from=deps /app/node_modules ./node_modules
# Барлық кодты көшіру
COPY ${APP_DIR} .

# Next.js телеметриясын өшіру
ENV NEXT_TELEMETRY_DISABLED=1

# --- Build-time Environmental Variables (Dokploy-дан келеді) ---
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Жобаны жинау
RUN npm run build

# 3. Production үшін дайын имидж жасау
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Қауіпсіздік үшін арнайы қолданушы жасау
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Қажетті файлдарды ғана көшіру (имидж көлемін азайту үшін)
COPY --from=builder /app/public ./public

# Prerender кэші үшін папка жасау және рұқсат беру
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Next.js standalone режимін қолдану (өте тиімді)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Серверді іске қосу
CMD ["node", "server.js"]
