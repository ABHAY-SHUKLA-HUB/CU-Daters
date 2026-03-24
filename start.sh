#!/bin/bash

# Build frontend if dist folder doesn't exist
if [ ! -d "dist" ]; then
  echo "📦 dist folder not found. Installing dependencies and building..."
  npm install
  npm run build
fi

echo "🚀 Starting server..."
node server.js
