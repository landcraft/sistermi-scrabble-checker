# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Data Ingestion ---
FROM node:20-alpine AS data-builder
WORKDIR /app
COPY package*.json ./
# Install backend dependencies (including sqlite3 which needs compilation on some systems, 
# though sqlite3 usually provides prebuilt binaries for alpine nowadays)
RUN apk add --no-cache python3 make g++ && npm install --production
COPY scripts/ scripts/
# Run the ingestion script (creates data/words.db)
RUN node scripts/fetch_words.js

# --- Stage 3: Production ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and package.json from data-builder (since it includes backend deps)
COPY --from=data-builder /app/node_modules ./node_modules
COPY --from=data-builder /app/package.json ./

# Copy backend source
COPY server.js ./

# Copy generated database
COPY --from=data-builder /app/data ./data

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000
CMD ["node", "server.js"]
