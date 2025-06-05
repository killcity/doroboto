# DoRoboto Docker Deployment

This guide covers running DoRoboto using Docker with support for both **ARM64** (Raspberry Pi) and **x86** architectures.

## 🚀 Quick Start

### Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- 4GB+ RAM recommended
- 2GB+ free disk space

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/killcity/doroboto.git
   cd doroboto
   ```

2. **Make the startup script executable:**
   ```bash
   chmod +x docker-start.sh
   ```

3. **Start the application:**
   ```bash
   ./docker-start.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 🏗️ Architecture Support

### Automatic Detection
The startup script automatically detects your system architecture:

- **x86_64**: Standard desktop/server systems
- **ARM64/aarch64**: Raspberry Pi 4, Apple Silicon Macs, ARM servers

### Manual Platform Selection
To force a specific platform:

```bash
# For x86 systems
DOCKER_DEFAULT_PLATFORM=linux/amd64 ./docker-start.sh

# For ARM64 systems (Raspberry Pi)
DOCKER_DEFAULT_PLATFORM=linux/arm64 ./docker-start.sh
```

## 📋 Available Commands

```bash
# Start services (default)
./docker-start.sh start

# Stop services
./docker-start.sh stop

# Restart services
./docker-start.sh restart

# View logs
./docker-start.sh logs

# Check service status
./docker-start.sh status

# Build images only
./docker-start.sh build
```

## 🐳 Docker Compose Services

### Frontend Service
- **Image**: Next.js 14 with TypeScript
- **Port**: 3000
- **Features**: 
  - Standalone output for optimal Docker performance
  - Hot reload in development
  - Optimized production builds

### Backend Service
- **Image**: Node.js 18 with Express + Socket.IO
- **Port**: 5001
- **Features**:
  - Virtual GRBL plotter simulation
  - Real-time WebSocket communication
  - Health check endpoint
  - File upload support

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001

# Backend Configuration
NODE_ENV=production
PORT=5001

# Docker Configuration
COMPOSE_PROJECT_NAME=doroboto
```

### Volume Mounts

The following directories are mounted for persistence:

- `./uploads` → Container uploads directory
- `./test_files` → Container test files directory
- Named volumes for `node_modules` (performance optimization)

## 🥧 Raspberry Pi Specific Setup

### System Requirements
- Raspberry Pi 4 (4GB+ RAM recommended)
- Raspberry Pi OS (64-bit)
- Docker installed via convenience script

### Installation on Raspberry Pi

1. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Install Docker Compose:**
   ```bash
   sudo apt update
   sudo apt install docker-compose-plugin
   ```

3. **Optimize for ARM64:**
   ```bash
   # Enable memory cgroup (add to /boot/cmdline.txt)
   sudo nano /boot/cmdline.txt
   # Add: cgroup_enable=memory cgroup_memory=1
   
   # Reboot
   sudo reboot
   ```

4. **Start DoRoboto:**
   ```bash
   git clone https://github.com/killcity/doroboto.git
   cd doroboto
   chmod +x docker-start.sh
   ./docker-start.sh
   ```

## 🔍 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5001

# Stop conflicting services
./docker-start.sh stop
```

**Memory issues on Raspberry Pi:**
```bash
# Check memory usage
free -h
docker stats

# Increase swap if needed
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Build failures:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
./docker-start.sh build
```

### Health Checks

Check service health:
```bash
# Backend health
curl http://localhost:5001/api/health

# Frontend health
curl http://localhost:3000

# Docker health status
docker ps
```

### Logs and Debugging

```bash
# View all logs
./docker-start.sh logs

# View specific service logs
docker-compose logs frontend
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

## 🚀 Production Deployment

### Security Considerations

1. **Change default ports** (optional):
   ```yaml
   # In docker-compose.yml
   ports:
     - "8080:3000"  # Frontend
     - "8081:5001"  # Backend
   ```

2. **Use environment files**:
   ```bash
   # Create production.env
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

3. **Enable HTTPS** (with reverse proxy):
   ```bash
   # Example with nginx
   sudo apt install nginx
   # Configure SSL certificates
   ```

### Performance Optimization

1. **Resource limits**:
   ```yaml
   # Add to docker-compose.yml services
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '0.5'
   ```

2. **Multi-stage builds** (already implemented):
   - Optimized image sizes
   - Separate build and runtime environments
   - Minimal attack surface

## 📊 Monitoring

### Built-in Health Checks

- Backend: `GET /api/health`
- Docker health checks every 30 seconds
- Automatic restart on failure

### Resource Monitoring

```bash
# Real-time resource usage
docker stats

# Container information
docker inspect doroboto-frontend-1
docker inspect doroboto-backend-1
```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./docker-start.sh restart
```

### Backup and Restore

```bash
# Backup uploaded files
tar -czf doroboto-backup.tar.gz uploads/ test_files/

# Restore
tar -xzf doroboto-backup.tar.gz
```

## 🆘 Support

For issues specific to Docker deployment:

1. Check the logs: `./docker-start.sh logs`
2. Verify system requirements
3. Check Docker and Docker Compose versions
4. Review this documentation
5. Open an issue on GitHub with system details

### System Information Template

```bash
# Include this information when reporting issues
echo "System: $(uname -a)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "Architecture: $(uname -m)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h)"
``` 