# Multi-stage Dockerfile for Squid Protocol Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma Client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Security: Run as non-root user
USER node

# Copy built artifacts and runtime packages
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health/live || exit 1

# Apply additive, versioned schema updates before serving API traffic. The
# Render pre-deploy hook also runs this, while this startup check covers
# services whose Blueprint settings have not been synchronized yet.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
