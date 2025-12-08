#!/bin/sh

host="$1"
shift

until pg_isready -h "$host" -p 5432 -U "postgres"; do
  echo "Waiting for database at $host:5432..."
  sleep 2
done

echo "Database is ready!"
exec "$@"