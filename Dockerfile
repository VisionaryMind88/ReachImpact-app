FROM node:20-slim AS base

# Create application directory
WORKDIR /app

# Install all dependencies including dev dependencies
FROM base AS deps
COPY package.json package-lock.json ./
# Install all dependencies for build
RUN npm ci --include=dev

# Build the application
FROM base AS builder
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000

# Set non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

USER fastify

# Copy built files and production dependencies
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/package.json ./

# Create uploads directory within the application directory
RUN mkdir -p ./uploads
RUN chown -R fastify:nodejs ./uploads

# Copy additional required files
COPY --chown=fastify:nodejs ./shared ./shared

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the app
CMD ["node", "dist/index.js"]
