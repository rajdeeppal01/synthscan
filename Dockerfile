FROM node:24-bookworm-slim

# Install ffmpeg + yt-dlp (Linux binary)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
      -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install

# Copy application code and build
COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

# Start the Next.js server
CMD ["npm", "start"]
