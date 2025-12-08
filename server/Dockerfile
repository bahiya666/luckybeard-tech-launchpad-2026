# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install openssl for Prisma + postgres client for wait-for-db
RUN apk add --no-cache openssl postgresql-client

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy server code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Make scripts executable
RUN chmod +x start.sh wait-for-db.sh

# Expose API port
EXPOSE 3000

# Start server through start.sh
CMD ["sh", "/app/start.sh"]
