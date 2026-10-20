#!/bin/bash
# Adastra Dashboard Launcher

echo "🧹 Freeing ports 8000 and 5173 if already in use..."
lsof -ti:8000 -ti:5173 -ti:5174 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Backend
echo "Starting FastAPI Backend on port 8000..."
cd backend
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Vite Frontend on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "🚀 Dashboard is running!"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
