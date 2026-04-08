#!/bin/bash

# Mazir App Deployment Script for Kazakhstan VPS
set -e

echo "🚀 Starting Mazir App Deployment..."

# 1. Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker is not installed. Please install Docker first."
  exit 1
fi

# 2. Robust Detection of Docker Compose
DOCKER_COMPOSE=""
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "❌ Error: Docker Compose is not installed."
  echo "💡 Please install it using one of these commands:"
  echo "   sudo apt-get install docker-compose-v2  # (Modern plugin)"
  echo "   OR"
  echo "   sudo apt-get install docker-compose     # (Legacy binary)"
  exit 1
fi

echo "✅ Using $DOCKER_COMPOSE"

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

# 5. SSL Certificate Check
if [ ! -d "/etc/letsencrypt/live/mazirapp.kz" ]; then
  echo "⚠️  SSL Certificates not found in /etc/letsencrypt/live/mazirapp.kz"
  echo "💡 You might need to run Certbot first:"
  echo "   sudo apt-get install certbot"
  echo "   sudo certbot certonly --standalone -d mazirapp.kz -d www.mazirapp.kz -d secure-cafes-idishere.mazirapp.kz"
  echo "⚠️  Nginx may fail to start without these certificates."
fi

# 6. Build and Start Containers sequentially to save disk space
echo "🏗️  Building services sequentially..."
# 1. Start core services
$DOCKER_COMPOSE up -d postgres minio
echo "✅ Core services started."

# 2. Build admin app
echo "🏗️  Building Admin App..."
$DOCKER_COMPOSE up -d --build admin-app
echo "✅ Admin App built and started."

# 3. Clean build cache to free up space for next build
echo "🧹 Cleaning build cache to free space..."
docker builder prune -f

# 4. Build client app
echo "🏗️  Building Client App..."
$DOCKER_COMPOSE up -d --build client
echo "✅ Client App built and started."

# 5. Start Nginx
$DOCKER_COMPOSE up -d nginx

echo "✅ Deployment successful!"
echo "🌐 Your app should be running. Check Nginx logs or '$DOCKER_COMPOSE ps' for status."
echo "💡 Remember to configure your Freedom Pay and Kaspi credentials in the Admin panel to start making money!"
