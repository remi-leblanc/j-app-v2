# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24.17.0-alpine AS builder
 
WORKDIR /app
 
# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci
 
# Copy source and build
COPY . .
RUN npm run build
 
# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM node:24.17.0-alpine AS runner
 
WORKDIR /app
 
# Nuxt/Nitro bundles everything into .output — no node_modules needed
COPY --from=builder /app/.output ./.output
 
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
 
EXPOSE 3000
 
CMD ["node", ".output/server/index.mjs"]