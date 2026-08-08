#!/bin/sh
set -e
echo "Running database migrations..."
node ./node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run
echo "Starting application..."
exec node dist/main