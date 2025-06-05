# DoRoboto Docker Deployment Guide

This guide covers Docker deployment for the DoRoboto pen plotter control system, supporting both x86_64 and ARM64 architectures (including Raspberry Pi).

## 📋 Prerequisites

Before deploying DoRoboto with Docker, you need to install Docker on your system:

### 🪟 **Windows Installation**

1. **Download Docker Desktop**:
   - Visit [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - Download the installer for your system

2. **System Requirements**:
   - Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
   - OR Windows 11 64-bit: Home or Pro version 21H2 or higher
   - WSL 2 feature enabled
   - Virtualization enabled in BIOS

3. **Installation Steps**:
   ```bash
   # Run the downloaded installer
   # Follow the installation wizard
   # Restart your computer when prompted
   # Launch Docker Desktop from Start Menu
   ```

4. **Verify Installation**:
   ```bash
   # Open PowerShell or Command Prompt
   docker --version
   docker compose version
   ```

### 🍎 **macOS Installation**

1. **Download Docker Desktop**:
   - Visit [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - Choose the correct version:
     - **Intel Macs**: "Mac with Intel chip"
     - **Apple Silicon Macs**: "Mac with Apple chip"

2. **Installation Steps**:
   ```bash
   # Open the downloaded .dmg file
   # Drag Docker.app to Applications folder
   # Launch Docker from Applications
   # Complete the initial setup
   ```

3. **Verify Installation**:
   ```bash
   # Open Terminal
   docker --version
   docker compose version
   ```

### 🐧 **Linux Installation**

#### **Ubuntu/Debian:**
```bash
# Update package index
sudo apt update

# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Log out and back in, then verify
docker --version
docker compose version
```

#### **CentOS/RHEL/Fedora:**
```bash
# Install Docker (choose your distro)
sudo dnf install -y docker docker-compose  # Fedora
# OR
sudo yum install -y docker docker-compose  # CentOS/RHEL

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
docker compose version
```

#### **Arch Linux:**
```bash
# Install Docker
sudo pacman -S docker docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

### 🔧 **Post-Installation Setup**

After installing Docker on any platform:

1. **Verify Docker is running**:
   ```bash
   docker run hello-world
   ```

2. **Test Docker Compose**:
   ```bash
   docker compose version
   ```

3. **If you get permission errors on Linux**:
   ```bash
   # Make sure you're in the docker group
   groups $USER
   
   # If docker group is missing, add it and log out/in
   sudo usermod -aG docker $USER
   # Then log out and back in
   ```

## 🚀 Quick Start

### Production Mode (Recommended)
Uses pre-built images from GitHub Container Registry:

```bash
# Start the application
./docker-start.sh prod start

# View logs
./docker-start.sh prod logs

# Stop the application
./docker-start.sh prod stop
```

### Development Mode
Builds images locally for development:

```bash
# Start with local build
./docker-start.sh dev start

# Rebuild images
./docker-start.sh dev build

# View logs
./docker-start.sh dev logs
```

## 📦 Container Registry

DoRoboto uses GitHub Container Registry (ghcr.io) for hosting pre-built Docker images:

- **Frontend**: `ghcr.io/killcity/doroboto-frontend:latest`
- **Backend**: `ghcr.io/killcity/doroboto-backend:latest`

### Supported Architectures
- ✅ `linux/amd64` (x86_64)
- ✅ `linux/arm64` (ARM64/Raspberry Pi)

Images are automatically built for both architectures using GitHub Actions.

## 🔄 CI/CD Pipeline

### Automatic Image Building
GitHub Actions automatically builds and publishes Docker images when:

- **Push to main branch**: Creates `latest` tag
- **Pull requests**: Creates PR-specific tags for testing
- **Git tags**: Creates versioned releases (e.g., `v1.0.0`)

### Workflow Features
- Multi-architecture builds (AMD64 + ARM64)
- Layer caching for faster builds
- Automatic tagging and versioning
- Security scanning and vulnerability checks

### Manual Image Pull
```bash
# Pull latest images manually
docker pull ghcr.io/killcity/doroboto-frontend:latest
docker pull ghcr.io/killcity/doroboto-backend:latest

# Or use the script
./docker-start.sh prod pull
```

## 🛠️ Installation & Setup

### Prerequisites
- Docker Engine 20.10+ or Docker Desktop
- Docker Compose v2.0+ (or docker-compose v1.29+)
- 4GB+ RAM recommended
- 2GB+ free disk space

### Architecture Detection
The system automatically detects your architecture:
- **x86_64**: Intel/AMD processors
- **ARM64**: Apple Silicon, Raspberry Pi 4+, ARM servers

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/killcity/doroboto.git
cd doroboto

# Make the script executable
chmod +x docker-start.sh

# Start the application (production mode)
./docker-start.sh prod start
```

## 📋 Available Commands

### Production Mode Commands
```bash
./docker-start.sh prod start     # Start with registry images
./docker-start.sh prod stop      # Stop the application
./docker-start.sh prod restart   # Restart the application
./docker-start.sh prod logs      # Show application logs
./docker-start.sh prod status    # Show container status
./docker-start.sh prod pull      # Pull latest images
./docker-start.sh prod clean     # Clean up everything
```

### Development Mode Commands
```bash
./docker-start.sh dev start      # Start with local build
./docker-start.sh dev stop       # Stop the application
./docker-start.sh dev restart    # Restart the application
./docker-start.sh dev logs       # Show application logs
./docker-start.sh dev status     # Show container status
./docker-start.sh dev build      # Build/rebuild images
./docker-start.sh dev clean      # Clean up everything
```

### Default Mode
If no mode is specified, production mode is used:
```bash
./docker-start.sh start          # Same as 'prod start'
./docker-start.sh logs           # Same as 'prod logs'
```

## 🌐 Access URLs

Once started, the application is available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 📁 File Structure

```
doroboto/
├── docker-compose.yml          # Production compose (registry images)
├── docker-compose.dev.yml      # Development compose (local build)
├── docker-start.sh             # Management script
├── .github/
│   └── workflows/
│       └── docker-build.yml    # CI/CD pipeline
└── doroboto-ui/
    ├── Dockerfile.frontend     # Frontend image definition
    ├── Dockerfile.backend      # Backend image definition
    ├── uploads/                # Persistent file uploads
    └── test_files/             # Sample G-code files
```

## 🔧 Configuration

### Environment Variables

#### Frontend Container
- `NODE_ENV`: Set to `production` or `development`
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:5001)

#### Backend Container
- `NODE_ENV`: Set to `production` or `development`
- `PORT`: Server port (default: 5001)

### Volume Mounts
- `./doroboto-ui/uploads`: Persistent file uploads
- `./doroboto-ui/test_files`: Sample G-code files
- Named volumes for node_modules and build cache

### Port Configuration
To change default ports, edit the compose files:
```yaml
services:
  frontend:
    ports:
      - "3000:3000"  # Change first port for external access
  backend:
    ports:
      - "5001:5001"  # Change first port for external access
```

## 🥧 Raspberry Pi Deployment

### Recommended Hardware
- Raspberry Pi 4 (4GB+ RAM recommended)
- 32GB+ microSD card (Class 10 or better)
- Stable power supply (3A+ recommended)

### Installation Steps
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Logout and login again, then:
git clone https://github.com/killcity/doroboto.git
cd doroboto
chmod +x docker-start.sh
./docker-start.sh prod start
```

### Performance Optimization
```bash
# Increase swap space for building (if needed)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Enable memory cgroup (add to /boot/cmdline.txt)
cgroup_enable=memory cgroup_memory=1
```

## 🔍 Troubleshooting

### Common Issues

#### Docker Not Running
```bash
# Check Docker status
docker info

# Start Docker (Linux)
sudo systemctl start docker

# Start Docker Desktop (macOS/Windows)
# Use the Docker Desktop application
```

#### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :5001

# Stop conflicting services or change ports in compose files
```

#### Permission Issues
```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER doroboto-ui/uploads
chmod 755 doroboto-ui/uploads
```

#### Memory Issues (Raspberry Pi)
```bash
# Check available memory
free -h

# Stop other services to free memory
sudo systemctl stop unnecessary-service

# Use development mode for lighter resource usage
./docker-start.sh dev start
```

#### Image Pull Issues
```bash
# Check internet connectivity
ping ghcr.io

# Login to GitHub Container Registry (if needed)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Force pull latest images
./docker-start.sh prod pull
```

### Debug Mode
Enable verbose logging:
```bash
# Show detailed container logs
./docker-start.sh prod logs

# Check container health
docker ps
docker inspect doroboto-frontend
docker inspect doroboto-backend

# Access container shell for debugging
docker exec -it doroboto-backend /bin/sh
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 🔒 Security Considerations

### Production Deployment
- Change default ports if exposing to internet
- Use reverse proxy (nginx/traefik) for SSL termination
- Implement proper firewall rules
- Regular security updates for base images
- Monitor container logs for suspicious activity

### Network Security
```bash
# Restrict external access (example)
iptables -A INPUT -p tcp --dport 3000 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

## 📊 Monitoring & Maintenance

### Health Checks
The backend includes built-in health checks:
- Endpoint: `http://localhost:5001/api/health`
- Automatic container restart on failure
- 30-second check intervals

### Log Management
```bash
# View logs with timestamps
./docker-start.sh prod logs --timestamps

# Limit log output
./docker-start.sh prod logs --tail 100

# Follow logs in real-time
./docker-start.sh prod logs -f
```

### Updates
```bash
# Update to latest images (production)
./docker-start.sh prod pull
./docker-start.sh prod restart

# Update development build
./docker-start.sh dev build
./docker-start.sh dev restart
```

### Backup
```bash
# Backup uploaded files
tar -czf doroboto-backup-$(date +%Y%m%d).tar.gz doroboto-ui/uploads/

# Backup configuration
cp docker-compose.yml docker-compose.yml.backup
```

## 🆘 Support

### Getting Help
1. Check this documentation
2. Review container logs: `./docker-start.sh logs`
3. Check GitHub Issues: https://github.com/killcity/doroboto/issues
4. Verify system requirements and architecture compatibility

### Reporting Issues
When reporting issues, please include:
- Operating system and architecture
- Docker version: `docker --version`
- Docker Compose version: `docker compose version`
- Container logs: `./docker-start.sh logs`
- Steps to reproduce the issue

### Contributing
See the main README.md for contribution guidelines and development setup instructions. 