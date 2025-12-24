# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy package files terlebih dahulu
COPY package.json package-lock.json* ./

# 2. Install dependencies
RUN npm ci --only=production

# 3. Copy source code
COPY . .

# 4. Fix common issues sebelum build
RUN echo "Checking and fixing source files..."

# 4.2. Backup original next.config.ts
RUN cp next.config.ts next.config.ts.backup 2>/dev/null || true

# 4.3. Create fixed next.config.ts
RUN cat > next.config.ts << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  // serverComponentsExternalPackages sudah deprecated, pindahkan ke serverExternalPackages
  serverExternalPackages: ['@google/generative-ai', 'pdf-parse', 'mammoth', 'pdf2json', 'pdfjs-dist'],
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  
  experimental: {
    // Kosongkan atau tambahkan experimental features lain
  },
};

export default nextConfig;
EOF

# 5. Set environment variables untuk build
ENV NEXT_DISABLE_ESLINT=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 6. Install devDependencies untuk build
RUN npm ci --include=dev

# 7. Build Next.js dengan verbose output
RUN echo "Building Next.js application..." && \
    npm run build 2>&1 | tee build.log || (echo "Build failed, checking logs..." && cat build.log && exit 1)

# 8. Verifikasi build berhasil
RUN if [ ! -f ".next/BUILD_ID" ]; then \
      echo "ERROR: Build failed - BUILD_ID not found!" && \
      echo "Contents of .next directory:" && \
      ls -la .next/ 2>/dev/null || echo ".next directory does not exist" && \
      exit 1; \
    else \
      echo "✅ Build successful! BUILD_ID: $(cat .next/BUILD_ID)" && \
      echo "Build output size:" && \
      du -sh .next/; \
    fi

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# 1. Install curl untuk healthcheck
RUN apk add --no-cache curl

# 2. Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 3. Copy hanya yang diperlukan dari builder stage
# 3.1. Package files
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# 3.2. Production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 3.3. Build output (paling penting!)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# 3.4. Public files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 3.5. Konfigurasi
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /app/postcss.config.mjs ./

# 4. Switch ke non-root user
USER nextjs

# 5. Expose port
EXPOSE 3000

# 6. Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/hello || exit 1

# 7. Start aplikasi
CMD ["npm", "start"]