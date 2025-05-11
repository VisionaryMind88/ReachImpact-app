FROM node:20-slim AS base

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create application directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run
FROM base AS runner

# Set non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify
USER fastify

# Copy production dependencies
COPY --from=deps --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/package.json ./

# Set environment for fly volume
VOLUME /data

# Create uploads directory
RUN mkdir -p /data/uploads
RUN chown -R fastify:nodejs /data

# Copy additional required files
COPY --chown=fastify:nodejs ./shared ./shared

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["node", "dist/server.js"]