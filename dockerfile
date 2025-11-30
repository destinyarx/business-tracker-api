# ============================
# STAGE 1: BUILD
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build NestJS (TypeScript → dist/)
RUN npm run build

# ============================
# STAGE 2: PRODUCTION
# ============================
FROM node:20-alpine AS production

WORKDIR /app

# Copy package.json and install ONLY production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Expose NestJS default port
EXPOSE 3000

# Start server
CMD ["node", "dist/src/main.js"]
