#!/bin/bash

echo "🚀 Starting Stock Market Prediction Application"
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Create data directory if it doesn't exist
mkdir -p data

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Start backend server
echo "🔧 Starting Flask backend server..."
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Start frontend development server
echo "🎨 Starting React frontend server..."
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Application is starting up!"
echo "=============================================="
echo "📊 Backend API: http://localhost:5000"
echo "🎨 Frontend App: http://localhost:3000"
echo ""
echo "📝 Demo Credentials:"
echo "   User: user123 / password123"
echo "   Admin: admin / admin123"
echo ""
echo "⏹️  To stop the application, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait