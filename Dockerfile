# Production Dockerfile for SyncMate Backend
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy dependency specifications
COPY package*.json ./

# Install only production dependencies reliably without lockfile strictness issues
RUN npm install --omit=dev --no-audit --no-fund

# Copy backend source code
COPY src/ ./src/

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "src/server.js"]
