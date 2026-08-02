#!/bin/bash
# Development script for Bun-based CodeViewer

echo "🚀 Starting CodeViewer with Bun..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Replace package.json files with Bun versions
echo "📦 Setting up Bun configuration..."
cp package.bun.json package.json
cp backend/package.bun.json backend/package.json

# Install dependencies
echo "📥 Installing dependencies..."
bun install
cd backend && bun install
cd ..

# Initialize database
echo "🗄️  Initializing database..."
cd backend && bun run migrate
cd ..

# Start both frontend and backend
echo "🌟 Starting development servers..."
bun run dev