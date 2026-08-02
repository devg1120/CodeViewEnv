#!/bin/bash

# Kill switch for CodeViewer ports
# Kills processes running on our specific ports: 5200, 5201, 7900

PORTS=(5200 5201 7900)
KILLED_ANY=false

echo "🔍 Checking for processes on CodeViewer ports..."

for PORT in "${PORTS[@]}"; do
    # Find processes using the port
    PIDS=$(lsof -ti :$PORT 2>/dev/null)
    
    if [ ! -z "$PIDS" ]; then
        echo "⚡ Killing processes on port $PORT:"
        for PID in $PIDS; do
            PROCESS_NAME=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
            echo "  - PID $PID ($PROCESS_NAME)"
            kill -TERM $PID 2>/dev/null
            
            # Give it a moment to terminate gracefully
            sleep 0.5
            
            # Force kill if still running
            if kill -0 $PID 2>/dev/null; then
                echo "  - Force killing PID $PID"
                kill -KILL $PID 2>/dev/null
            fi
        done
        KILLED_ANY=true
    fi
done

if [ "$KILLED_ANY" = false ]; then
    echo "✅ All ports are clean"
else
    echo "✅ Port cleanup complete"
    # Give a bit more time for cleanup
    sleep 1
fi

echo ""