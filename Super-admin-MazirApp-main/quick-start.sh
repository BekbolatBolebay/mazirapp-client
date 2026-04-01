#!/usr/bin/env bash

# Quick Start Script for Cafe SaaS Admin MVP

echo "🚀 Cafe SaaS Admin - Quick Start"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from template..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your configuration"
    echo "   At minimum, set VITE_ENABLE_DEMO_MODE=true for development"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Ready to start!"
echo ""
echo "Available commands:"
echo "  - npm run dev              # Start frontend only (demo mode)"
echo "  - npm run dev:server       # Start API server only"
echo "  - npm run dev:all          # Start both frontend and server"
echo ""
echo "Next step: Run 'npm run dev:all' to start both servers"
