FROM node:20-alpine
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY server.js ./
COPY public/ ./public/

# Prepare folders for database and uploads
RUN mkdir -p /app/data /app/uploads/images /app/uploads/audio

EXPOSE 3000
CMD ["node", "server.js"]