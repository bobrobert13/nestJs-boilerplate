# Stage 1: Build
FROM node:22.18.0-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY apps/nominas/tsconfig.app.json ./apps/nominas/

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22.18.0-slim

WORKDIR /app

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libu2f-udev \
    libvulkan1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libgbm-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY apps/nominas/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Install Playwright browsers AS ROOT (use /opt/playwright to avoid permission issues)
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright/browsers
RUN mkdir -p /opt/playwright/browsers && \
    npx playwright install chromium 2>&1 | tee /tmp/playwright-install.log && \
    echo "Playwright installation completed" && \
    find /opt/playwright -name "chrome-headless-shell" -type f -exec chmod +x {} \; && \
    chmod -R 755 /opt/playwright

# Set Playwright environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright/browsers

# Create non-root user and give access to playwright cache
RUN useradd -m -u 1001 nodejs && \
    chown -R nodejs:nodejs /app && \
    chown nodejs:nodejs /usr/local/bin/entrypoint.sh && \
    chown -R nodejs:nodejs /opt/playwright

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/usuarios || exit 1

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/apps/nominas/main"]
