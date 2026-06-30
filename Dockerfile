# syntax=docker/dockerfile:1

##### 1. deps — install full dependency tree (cached layer) #####
FROM node:22-alpine AS deps
WORKDIR /app

# OpenSSL + libc6-compat are needed by Prisma's engines on Alpine
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

##### 2. builder — generate Prisma client + build the Next.js app #####
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# A DATABASE_URL must be present at build time only so that `next build`
# can statically analyze API routes; it is not used to connect to a real
# database during the build, and these are dummy placeholder values, not
# real credentials. Declared as ARG (build-stage only) rather than ENV so
# they aren't persisted as environment variables in any resulting image.
ARG DATABASE_URL="postgresql://user:password@localhost:5432/veille?schema=public"
ARG SESSION_SECRET="build-time-placeholder"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

##### 3. runner — minimal runtime image #####
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output: a self-contained server.js plus the minimal
# node_modules it needs to serve the app.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma CLI + schema + migrations + generated client, needed at startup
# to run `prisma migrate deploy` and for the bootstrap script.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# tsx + its deps, used to run the TypeScript bootstrap script directly
# without a separate compile step.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/tsx ./node_modules/.bin/tsx

# Source files needed by the bootstrap script (lib/prisma.ts, lib/auth.ts).
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
