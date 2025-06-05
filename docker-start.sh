#!/bin/bash

# DoRoboto Docker Startup Script
# Supports both ARM64 (Raspberry Pi) and x86 architectures

set -e

echo "🐳 DoRoboto Docker Setup"
echo "========================"

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        PLATFORM="linux/amd64"
        echo "🖥️  Detected x86_64 architecture"
        ;;
    aarch64|arm64)
        PLATFORM="linux/arm64"
        echo "🥧 Detected ARM64 architecture (Raspberry Pi compatible)"
        ;;
    *)
        echo "⚠️  Unknown architecture: $ARCH"
        echo "Defaulting to linux/amd64"
        PLATFORM="linux/amd64"
        ;;
esac

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    echo "💡 On macOS: Start Docker Desktop"
    echo "💡 On Linux: sudo systemctl start docker"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads test_files

# Set proper permissions
chmod 755 uploads test_files

# Function to start services
start_services() {
    echo "🚀 Starting DoRoboto services..."
    echo "Platform: $PLATFORM"
    
    # Use docker compose if available, fallback to docker-compose
    if docker compose version &> /dev/null; then
        DOCKER_BUILDKIT=1 docker compose up --build -d
    else
        DOCKER_BUILDKIT=1 docker-compose up --build -d
    fi
    
    echo "✅ Services started successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5001"
    echo ""
    echo "📋 Available commands:"
    echo "   ./docker-start.sh stop    - Stop services"
    echo "   ./docker-start.sh restart - Restart services"
    echo "   ./docker-start.sh logs    - View logs"
    echo "   ./docker-start.sh status  - Check status"
}

# Function to stop services
stop_services() {
    echo "⏹️  Stopping DoRoboto services..."
    
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    
    echo "✅ Services stopped successfully!"
}

# Function to restart services
restart_services() {
    echo "🔄 Restarting DoRoboto services..."
    stop_services
    sleep 2
    start_services
}

# Function to show logs
show_logs() {
    echo "📋 Showing service logs..."
    
    if docker compose version &> /dev/null; then
        docker compose logs -f
    else
        docker-compose logs -f
    fi
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# Function to build images
build_images() {
    echo "🔨 Building Docker images for $PLATFORM..."
    
    if docker compose version &> /dev/null; then
        DOCKER_BUILDKIT=1 docker compose build
    else
        DOCKER_BUILDKIT=1 docker-compose build
    fi
    
    echo "✅ Images built successfully!"
}

# Main script logic
case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    build)
        build_images
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|build}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services (default)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Show service logs"
        echo "  status  - Show service status"
        echo "  build   - Build Docker images"
        exit 1
        ;;
esac 