#!/bin/sh

# Wait for database
until pg_isready -h db -p 5432 -U "postgres"; do
  echo "Waiting for database at db:5432..."
  sleep 2
done

echo "Database is ready!"

# Apply database schema
npx prisma db push --accept-data-loss

# Start the server
node dist/server.js

# Start the server
node dist/server.js