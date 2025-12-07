# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy entire server code AFTER dependencies
COPY . .

# Make start.sh executable

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose API port
EXPOSE 3000

# Start server through start.sh (runs migrations + start)
RUN chmod +x start.sh
CMD ["sh", "/app/start.sh"]
