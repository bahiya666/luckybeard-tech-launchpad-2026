# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install openssl for Prisma + postgres client for wait-for-db
RUN apk add --no-cache openssl postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
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

# Start server through wait-for-db.sh
CMD ["sh", "/app/wait-for-db.sh", "db", "sh", "/app/start.sh"]
