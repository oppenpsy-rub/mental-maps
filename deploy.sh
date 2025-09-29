#!/bin/bash

# MentalMap-Tool Deployment Script
# Usage: ./deploy.sh [production|development]

set -e

ENVIRONMENT=${1:-development}
PROJECT_NAME="mentalmap-tool"

echo "🚀 MentalMap-Tool Deployment"
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p data uploads/audio logs config ssl

# Set permissions
chmod 755 data uploads logs config
chmod 700 ssl

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp env.example .env
    print_warning "Please edit .env file with your configuration before running again."
    exit 0
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("NODE_ENV" "PORT" "DB_PATH")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in .env file"
        exit 1
    fi
done

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Remove old images if in production
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Cleaning up old images..."
    docker-compose down --rmi all 2>/dev/null || true
fi

# Build and start containers
print_status "Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Health check
print_status "Performing health check..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:${PORT}/api/studies > /dev/null 2>&1; then
        print_status "Health check passed!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Health check failed after $max_attempts attempts"
        print_error "Check container logs: docker-compose logs"
        exit 1
    fi
    
    print_status "Health check attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
    sleep 5
    ((attempt++))
done

# Display status
print_status "Deployment completed successfully!"
echo ""
echo "📊 Service Information:"
echo "  Frontend: http://localhost:${PORT}"
echo "  API: http://localhost:${PORT}/api"
echo "  Health: http://localhost:${PORT}/api/studies"
echo ""
echo "📁 Data Directories:"
echo "  Database: $(pwd)/data"
echo "  Uploads: $(pwd)/uploads"
echo "  Logs: $(pwd)/logs"
echo ""
echo "🔧 Management Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Update services: docker-compose pull && docker-compose up -d"
echo ""

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
# MentalMap-Tool Backup Script

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📦 Creating backup..."

# Backup database
if [ -f "./data/mentalmap.db" ]; then
    cp ./data/mentalmap.db $BACKUP_DIR/mentalmap_${TIMESTAMP}.db
    echo "✅ Database backed up"
fi

# Backup uploads
if [ -d "./uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz uploads/
    echo "✅ Uploads backed up"
fi

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh

print_status "Backup script created: ./backup.sh"

# Create update script
print_status "Creating update script..."
cat > update.sh << 'EOF'
#!/bin/bash
# MentalMap-Tool Update Script

echo "🔄 Updating MentalMap-Tool..."

# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build

echo "✅ Update completed!"
EOF

chmod +x update.sh

print_status "Update script created: ./update.sh"

print_status "🎉 MentalMap-Tool is ready!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:${PORT} in your browser"
echo "2. Create your first study"
echo "3. Upload audio files if needed"
echo "4. Start collecting data!"
echo ""
echo "For support, check the README.md file."
