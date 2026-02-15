#!/bin/bash
# AV Rack Control Panel - Start Script
# Runs the production build on port 3000

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Check if production build exists
if [ ! -d ".next" ]; then
  echo "No production build found. Building..."
  npm run build
fi

echo "Starting AV Rack Control Panel on http://localhost:3000"
npm run start
