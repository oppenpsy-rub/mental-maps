#!/bin/bash

# MentalMap-Tool Deployment Script für RUB-Umgebung
# Ruhr-Universität Bochum MySQL Integration
# Usage: ./deploy.rub.sh [production|development]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="mentalmap-tool-rub"

echo "🎓 MentalMap-Tool Deployment für RUB"
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_NAME"
echo "Database: RUB MySQL Server"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_rub() {
    echo -e "${BLUE}[RUB]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker ist nicht installiert. Bitte installieren Sie Docker zuerst."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose ist nicht installiert. Bitte installieren Sie Docker Compose zuerst."
    exit 1
fi

# Check if RUB configuration exists
if [ ! -f ".env.rub" ]; then
    print_error "RUB-Konfigurationsdatei .env.rub nicht gefunden!"
    print_warning "Bitte kopieren Sie .env.rub.example zu .env.rub und passen Sie die Werte an."
    exit 1
fi

# Validate RUB database configuration
print_rub "Überprüfe RUB-Datenbankkonfiguration..."
source .env.rub

if [ "$DB_HOST" = "dbs.rub.de" ] && [ "$DB_USER" = "ihr_rub_username" ]; then
    print_error "Bitte passen Sie die RUB-Datenbankdaten in .env.rub an!"
    print_warning "Kontaktieren Sie das RUB IT-Services für die korrekten Zugangsdaten."
    exit 1
fi

# Create necessary directories
print_status "Erstelle Verzeichnisse..."
mkdir -p uploads/audio logs config ssl

# Set permissions
chmod 755 uploads logs config
chmod 700 ssl

# Check SSL certificates for RUB database
if [ "$DB_SSL" = "true" ] && [ ! -f "ssl/rub-ca.pem" ]; then
    print_warning "SSL-Zertifikat für RUB-Datenbank nicht gefunden."
    print_warning "Bitte laden Sie das CA-Zertifikat von RUB IT-Services herunter:"
    print_warning "  ssl/rub-ca.pem"
fi

# Stop existing containers
print_status "Stoppe bestehende Container..."
docker-compose -f docker-compose.rub.yml down --remove-orphans || true

# Build and start containers
print_status "Baue und starte Container..."
docker-compose -f docker-compose.rub.yml up -d --build

# Wait for services to be ready
print_status "Warte auf Service-Start..."
sleep 15

# Health check with retry logic
print_status "Führe Health-Check durch..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3003/api/studies >/dev/null 2>&1; then
        print_status "Health-Check erfolgreich!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Health-Check fehlgeschlagen nach $max_attempts Versuchen"
        print_error "Überprüfen Sie die Container-Logs: docker-compose -f docker-compose.rub.yml logs"
        exit 1
    fi
    
    print_status "Health-Check Versuch $attempt/$max_attempts fehlgeschlagen, wiederhole in 5 Sekunden..."
    sleep 5
    ((attempt++))
done

# Display deployment information
print_status "🎉 Deployment erfolgreich abgeschlossen!"
echo ""
echo "📊 Service-Informationen:"
echo "  Frontend: http://localhost:3003"
echo "  API: http://localhost:3003/api"
echo "  Health: http://localhost:3003/api/studies"
echo ""
print_rub "🏛️ RUB-Integration:"
echo "  Datenbank: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  SSL: $DB_SSL"
echo ""
echo "📁 Datenverzeichnisse:"
echo "  Uploads: $(pwd)/uploads"
echo "  Logs: $(pwd)/logs"
echo "  SSL: $(pwd)/ssl"
echo ""
echo "🔧 Management-Befehle:"
echo "  Logs anzeigen: docker-compose -f docker-compose.rub.yml logs -f"
echo "  Services stoppen: docker-compose -f docker-compose.rub.yml down"
echo "  Services neustarten: docker-compose -f docker-compose.rub.yml restart"
echo "  Services aktualisieren: docker-compose -f docker-compose.rub.yml pull && docker-compose -f docker-compose.rub.yml up -d"
echo ""

# Create RUB-specific backup script
print_status "Erstelle RUB-Backup-Script..."
cat > backup.rub.sh << 'EOF'
#!/bin/bash
# MentalMap-Tool Backup Script für RUB-Umgebung

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📦 Erstelle RUB-Backup..."

# Backup uploads (Datenbank wird von RUB verwaltet)
if [ -d "./uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_rub_${TIMESTAMP}.tar.gz uploads/
    echo "✅ Uploads gesichert"
fi

# Backup logs
if [ -d "./logs" ]; then
    tar -czf $BACKUP_DIR/logs_rub_${TIMESTAMP}.tar.gz logs/
    echo "✅ Logs gesichert"
fi

# Backup configuration
if [ -f ".env.rub" ]; then
    cp .env.rub $BACKUP_DIR/env_rub_${TIMESTAMP}.backup
    echo "✅ Konfiguration gesichert"
fi

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*rub*" -mtime +7 -delete

echo "✅ RUB-Backup abgeschlossen: $BACKUP_DIR"
echo "ℹ️  Datenbank-Backups werden von RUB IT-Services verwaltet"
EOF

chmod +x backup.rub.sh
print_status "RUB-Backup-Script erstellt: ./backup.rub.sh"

# Create RUB-specific update script
print_status "Erstelle RUB-Update-Script..."
cat > update.rub.sh << 'EOF'
#!/bin/bash
# MentalMap-Tool Update Script für RUB-Umgebung

echo "🔄 Aktualisiere MentalMap-Tool (RUB-Version)..."

# Pull latest images
docker-compose -f docker-compose.rub.yml pull

# Rebuild and restart
docker-compose -f docker-compose.rub.yml up -d --build

echo "✅ RUB-Update abgeschlossen!"
EOF

chmod +x update.rub.sh
print_status "RUB-Update-Script erstellt: ./update.rub.sh"

print_rub "🎓 MentalMap-Tool ist bereit für die RUB-Umgebung!"
echo ""
echo "Nächste Schritte:"
echo "1. Öffnen Sie http://localhost:3003 in Ihrem Browser"
echo "2. Erstellen Sie Ihre erste Studie"
echo "3. Testen Sie die RUB-Datenbankverbindung"
echo "4. Kontaktieren Sie RUB IT-Services bei Problemen"
echo ""
echo "📞 RUB IT-Services Kontakt:"
echo "  E-Mail: it-services@rub.de"
echo "  Web: https://www.it-services.ruhr-uni-bochum.de/"
echo ""
echo "Für weitere Unterstützung, lesen Sie die README.md Datei."