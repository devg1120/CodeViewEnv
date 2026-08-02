#!/bin/bash

# Start both development servers in parallel
echo "🚀 Starting development servers..."
echo "   Frontend: http://localhost:5200"
echo "   Backend:  http://localhost:7900"
echo ""

# Start frontend in background
echo "📱 Starting frontend server..."
bun run dev:frontend &
FRONTEND_PID=$!

# Start backend in background  
echo "🔧 Starting backend server..."
bun run dev:backend &
BACKEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit
}

# Trap CTRL+C and cleanup
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait