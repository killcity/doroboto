#!/bin/bash

# DoRoboto Docker Management Script
# Supports both production (registry images) and development (local build) modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        PLATFORM="linux/amd64"
        ARCH_NAME="x86_64"
        ;;
    aarch64|arm64)
        PLATFORM="linux/arm64"
        ARCH_NAME="ARM64"
        ;;
    *)
        echo -e "${YELLOW}⚠️  Unknown architecture: $ARCH${NC}"
        echo -e "${YELLOW}   Defaulting to linux/amd64${NC}"
        PLATFORM="linux/amd64"
        ARCH_NAME="Unknown"
        ;;
esac

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running!${NC}"
        echo -e "${YELLOW}💡 Please start Docker Desktop or Docker daemon and try again.${NC}"
        exit 1
    fi
}

# Determine Docker Compose command
get_docker_compose_cmd() {
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo -e "${RED}❌ Neither 'docker compose' nor 'docker-compose' found!${NC}"
        echo -e "${YELLOW}💡 Please install Docker Compose and try again.${NC}"
        exit 1
    fi
}

# Create required directories
create_directories() {
    echo -e "${BLUE}📁 Creating required directories...${NC}"
    mkdir -p doroboto-ui/uploads
    mkdir -p doroboto-ui/test_files
    
    # Set proper permissions
    chmod 755 doroboto-ui/uploads
    chmod 755 doroboto-ui/test_files
}

# Show usage information
show_usage() {
    echo -e "${CYAN}🐳 DoRoboto Docker Management${NC}"
    echo ""
    echo -e "${GREEN}Usage:${NC}"
    echo "  $0 [MODE] [COMMAND]"
    echo ""
    echo -e "${GREEN}Modes:${NC}"
    echo -e "  ${YELLOW}prod${NC}     Use pre-built images from GitHub Container Registry (default)"
    echo -e "  ${YELLOW}dev${NC}      Build images locally for development"
    echo ""
    echo -e "${GREEN}Commands:${NC}"
    echo -e "  ${YELLOW}start${NC}    Start the application"
    echo -e "  ${YELLOW}stop${NC}     Stop the application"
    echo -e "  ${YELLOW}restart${NC}  Restart the application"
    echo -e "  ${YELLOW}logs${NC}     Show application logs"
    echo -e "  ${YELLOW}status${NC}   Show container status"
    echo -e "  ${YELLOW}build${NC}    Build/rebuild images (dev mode only)"
    echo -e "  ${YELLOW}pull${NC}     Pull latest images (prod mode only)"
    echo -e "  ${YELLOW}clean${NC}    Stop and remove containers, networks, and volumes"
    echo ""
    echo -e "${GREEN}Examples:${NC}"
    echo "  $0 prod start     # Start with registry images"
    echo "  $0 dev start      # Start with local build"
    echo "  $0 logs           # Show logs (uses default mode)"
    echo "  $0 dev build      # Rebuild development images"
    echo ""
    echo -e "${GREEN}Architecture:${NC} ${ARCH_NAME} (${PLATFORM})"
}

# Parse arguments
MODE="prod"  # Default mode
COMMAND=""

# Parse arguments
if [ $# -eq 0 ]; then
    show_usage
    exit 0
elif [ $# -eq 1 ]; then
    # Single argument - could be mode or command
    case $1 in
        prod|dev)
            MODE=$1
            echo -e "${YELLOW}⚠️  Mode specified but no command given${NC}"
            show_usage
            exit 1
            ;;
        start|stop|restart|logs|status|build|pull|clean|help)
            COMMAND=$1
            ;;
        *)
            echo -e "${RED}❌ Unknown argument: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
elif [ $# -eq 2 ]; then
    # Two arguments - mode and command
    case $1 in
        prod|dev)
            MODE=$1
            COMMAND=$2
            ;;
        *)
            echo -e "${RED}❌ Invalid mode: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
else
    echo -e "${RED}❌ Too many arguments${NC}"
    show_usage
    exit 1
fi

# Validate command
case $COMMAND in
    start|stop|restart|logs|status|clean)
        ;;
    build)
        if [ "$MODE" = "prod" ]; then
            echo -e "${YELLOW}⚠️  Build command not applicable in production mode${NC}"
            echo -e "${YELLOW}   Use 'pull' to get latest images or switch to 'dev' mode${NC}"
            exit 1
        fi
        ;;
    pull)
        if [ "$MODE" = "dev" ]; then
            echo -e "${YELLOW}⚠️  Pull command not applicable in development mode${NC}"
            echo -e "${YELLOW}   Use 'build' to rebuild images or switch to 'prod' mode${NC}"
            exit 1
        fi
        ;;
    help)
        show_usage
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        show_usage
        exit 1
        ;;
esac

# Set compose file based on mode
if [ "$MODE" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    MODE_DESC="Development (Local Build)"
else
    COMPOSE_FILE="docker-compose.yml"
    MODE_DESC="Production (Registry Images)"
fi

# Check prerequisites
check_docker
DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)

echo -e "${PURPLE}🐳 DoRoboto Docker Management${NC}"
echo -e "${BLUE}📋 Mode: ${MODE_DESC}${NC}"
echo -e "${BLUE}🏗️  Architecture: ${ARCH_NAME} (${PLATFORM})${NC}"
echo -e "${BLUE}📄 Compose File: ${COMPOSE_FILE}${NC}"
echo ""

# Execute command
case $COMMAND in
    start)
        echo -e "${GREEN}🚀 Starting DoRoboto application...${NC}"
        create_directories
        
        if [ "$MODE" = "prod" ]; then
            echo -e "${BLUE}📥 Pulling latest images...${NC}"
            $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE pull
        fi
        
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
        
        echo ""
        echo -e "${GREEN}✅ DoRoboto started successfully!${NC}"
        echo -e "${CYAN}🌐 Frontend: http://localhost:3000${NC}"
        echo -e "${CYAN}🔗 Backend API: http://localhost:5001${NC}"
        echo ""
        echo -e "${YELLOW}💡 Use '$0 $MODE logs' to view application logs${NC}"
        echo -e "${YELLOW}💡 Use '$0 $MODE stop' to stop the application${NC}"
        ;;
        
    stop)
        echo -e "${YELLOW}🛑 Stopping DoRoboto application...${NC}"
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down
        echo -e "${GREEN}✅ DoRoboto stopped successfully!${NC}"
        ;;
        
    restart)
        echo -e "${YELLOW}🔄 Restarting DoRoboto application...${NC}"
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down
        
        if [ "$MODE" = "prod" ]; then
            echo -e "${BLUE}📥 Pulling latest images...${NC}"
            $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE pull
        fi
        
        create_directories
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
        echo -e "${GREEN}✅ DoRoboto restarted successfully!${NC}"
        ;;
        
    logs)
        echo -e "${BLUE}📋 Showing DoRoboto application logs...${NC}"
        echo -e "${YELLOW}💡 Press Ctrl+C to exit logs${NC}"
        echo ""
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f
        ;;
        
    status)
        echo -e "${BLUE}📊 DoRoboto container status:${NC}"
        echo ""
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps
        ;;
        
    build)
        echo -e "${BLUE}🔨 Building DoRoboto images locally...${NC}"
        create_directories
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
        echo -e "${GREEN}✅ Images built successfully!${NC}"
        ;;
        
    pull)
        echo -e "${BLUE}📥 Pulling latest DoRoboto images...${NC}"
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE pull
        echo -e "${GREEN}✅ Images pulled successfully!${NC}"
        ;;
        
    clean)
        echo -e "${YELLOW}🧹 Cleaning up DoRoboto containers, networks, and volumes...${NC}"
        $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down -v --remove-orphans
        
        # Remove images if in dev mode
        if [ "$MODE" = "dev" ]; then
            echo -e "${YELLOW}🗑️  Removing development images...${NC}"
            docker image rm doroboto-ui-frontend doroboto-ui-backend 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ Cleanup completed!${NC}"
        ;;
esac 