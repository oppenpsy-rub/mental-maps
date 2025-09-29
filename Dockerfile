# Multi-stage build für optimale Image-Größe
FROM node:18-alpine AS builder

WORKDIR /app

# Backend Dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Frontend Dependencies und Build
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Root Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Production Image
FROM node:18-alpine

WORKDIR /app

# System Dependencies
RUN apk add --no-cache sqlite

# Copy Backend
COPY --from=builder /app/server/ ./server/

# Copy Frontend Build
COPY --from=builder /app/client/build/ ./client/build/

# Copy Root Dependencies
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/package*.json ./

# Create directories
RUN mkdir -p uploads/audio data

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/api/studies', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "server/index.js"]
