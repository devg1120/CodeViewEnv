#!/bin/bash

# Pre-flight script for CodeViewer development
# 1. Kills processes on our ports
# 2. Updates dependencies
# 3. Prepares for clean development start

echo "🚀 CodeViewer Pre-flight Check"
echo "=============================="

# Step 1: Kill processes on our ports
echo "Step 1: Port cleanup"
./scripts/kill-ports.sh

# Step 2: Install/update dependencies
echo "Step 2: Installing dependencies"
echo "📦 Installing root dependencies..."
bun install

echo "📦 Installing backend dependencies..."
bun install --cwd backend

# Step 3: Verify critical files
echo ""
echo "Step 3: Verifying setup"

if [ ! -f "backend/src/server.ts" ]; then
    echo "❌ Backend server file missing"
    exit 1
fi

if [ ! -f "src/main.tsx" ]; then
    echo "❌ Frontend entry file missing"
    exit 1
fi

if [ ! -f "config/ports.json" ]; then
    echo "❌ Port configuration missing"
    exit 1
fi

echo "✅ All systems ready"
echo ""
echo "🎯 Ready to start development servers!"
echo "   Frontend: http://localhost:5200"
echo "   Backend:  http://localhost:7900"
echo ""