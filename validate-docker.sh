#!/bin/bash

# DoRoboto Docker Configuration Validator
# Checks if all Docker files are properly configured

echo "🔍 DoRoboto Docker Configuration Validator"
echo "=========================================="

# Check if required files exist
echo "📁 Checking required files..."

required_files=(
    "docker-compose.yml"
    "doroboto-ui/Dockerfile.frontend"
    "doroboto-ui/Dockerfile.backend"
    "doroboto-ui/package.json"
    "doroboto-ui/next.config.js"
    "doroboto-ui/.dockerignore"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

# Check if directories exist
echo ""
echo "📂 Checking required directories..."

required_dirs=(
    "doroboto-ui/src"
    "doroboto-ui/backend"
    "uploads"
    "test_files"
)

missing_dirs=()

for dir in "${required_dirs[@]}"; do
    if [[ -d "$dir" ]]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ (missing)"
        missing_dirs+=("$dir")
    fi
done

# Validate docker-compose.yml syntax
echo ""
echo "🔧 Validating docker-compose.yml syntax..."

if command -v docker-compose &> /dev/null; then
    if docker-compose config &> /dev/null; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml has syntax errors"
        echo "Run 'docker-compose config' for details"
    fi
elif docker compose version &> /dev/null; then
    if docker compose config &> /dev/null; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml has syntax errors"
        echo "Run 'docker compose config' for details"
    fi
else
    echo "⚠️  Docker Compose not found - skipping syntax validation"
fi

# Check package.json for required scripts
echo ""
echo "📦 Checking package.json configuration..."

if [[ -f "doroboto-ui/package.json" ]]; then
    if grep -q '"dev"' doroboto-ui/package.json; then
        echo "✅ dev script found"
    else
        echo "❌ dev script missing"
    fi
    
    if grep -q '"build"' doroboto-ui/package.json; then
        echo "✅ build script found"
    else
        echo "❌ build script missing"
    fi
    
    if grep -q '"backend"' doroboto-ui/package.json; then
        echo "✅ backend script found"
    else
        echo "❌ backend script missing"
    fi
else
    echo "❌ package.json not found"
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="

if [[ ${#missing_files[@]} -eq 0 && ${#missing_dirs[@]} -eq 0 ]]; then
    echo "✅ All required files and directories are present"
    echo "🐳 Docker configuration appears to be complete"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Ensure Docker is installed and running"
    echo "   2. Run: ./docker-start.sh"
    echo "   3. Access: http://localhost:3000"
else
    echo "❌ Missing files or directories detected"
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo ""
        echo "Missing files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
    fi
    
    if [[ ${#missing_dirs[@]} -gt 0 ]]; then
        echo ""
        echo "Missing directories:"
        for dir in "${missing_dirs[@]}"; do
            echo "  - $dir/"
        done
    fi
    
    echo ""
    echo "Please ensure all required files are present before running Docker."
fi

echo ""
echo "📖 For detailed Docker setup instructions, see: DOCKER.md" 