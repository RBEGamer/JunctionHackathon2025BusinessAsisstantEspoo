# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build the frontend application
RUN npm run build:new-interface
#RUN npm run build
# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/track_definitons ./track_definitons
COPY server.js ./

# Expose the port the app runs on
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]

