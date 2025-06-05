#!/bin/bash

echo "🖊️ Starting DoRoboto - Modern Pen Plotter Interface"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"
echo ""

# Navigate to the Next.js application directory
cd doroboto-ui

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting DoRoboto Application..."
echo "🔧 Backend: Node.js + Express + Socket.IO"
echo "🎨 Frontend: Next.js + React + TypeScript"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API will be available at: http://localhost:5001"
echo ""
echo "📋 Virtual plotter ports available for testing:"
echo "   • /dev/ttyUSB0 - Standard Virtual Plotter"
echo "   • /dev/ttyACM0 - Arduino Virtual Plotter"
echo "   • COM3 - Windows Virtual Plotter"
echo ""
echo "💡 Test tip: Upload test_files/simple_square.gcode to see it in action!"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=================================================="

# Start both backend and frontend concurrently
npm run dev:full 