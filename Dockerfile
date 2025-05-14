# Build stage
FROM node:20-slim AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/shared ./shared

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]

