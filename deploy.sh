#!/bin/bash

# Mazir App Deployment Script for Kazakhstan VPS
set -e

echo "🚀 Starting Mazir App Deployment..."

# 1. Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker is not installed. Please install Docker first."
  exit 1
fi

# 2. Check if Docker Compose is installed
if ! [ -x "$(command -v docker compose)" ]; then
  echo "❌ Error: Docker Compose is not installed."
  exit 1
fi

# 3. Create volumes directory if it doesn't exist
echo "📁 Creating data volumes..."
mkdir -p volumes/postgres/data
mkdir -p volumes/minio/data

# 4. Check for .env file
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ Created .env. Please edit it with your production secrets (POSTGRES_PASSWORD, etc.)"
  else
    echo "❌ Error: .env.example not found. Cannot create .env."
    exit 1
  fi
fi

# 5. Build and Start Containers
echo "🏗️  Building and starting containers..."
docker compose up -d --build

echo "✅ Deployment successful!"
echo "🌐 Your app should be running. Check Nginx logs or 'docker compose ps' for status."
echo "💡 Remember to configure your Freedom Pay and Kaspi credentials in the Admin panel to start making money!"
