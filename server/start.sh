#!/bin/sh
set -e

# Wait for database
./wait-for-db.sh db

# Run Prisma migrations
npx prisma migrate deploy

# Start Node server
exec npm start
