#!/bin/bash

# =============================================================================
# MentalMap-Tool - RUB Update Script
# =============================================================================
# Update-Script für Ruhr-Universität Bochum Deployment
# =============================================================================

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen für farbigen Output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# KONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.rub.yml"
ENV_FILE=".env.rub"
BACKUP_BEFORE_UPDATE=true

# =============================================================================
# FUNKTIONEN
# =============================================================================

check_prerequisites() {
    print_info "Überprüfe Voraussetzungen..."
    
    # Docker prüfen
    if ! command -v docker &> /dev/null; then
        print_error "Docker ist nicht installiert oder nicht im PATH"
        exit 1
    fi
    
    # Docker Compose prüfen
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose ist nicht installiert oder nicht im PATH"
        exit 1
    fi
    
    # Compose-Datei prüfen
    if [ ! -f "${SCRIPT_DIR}/${COMPOSE_FILE}" ]; then
        print_error "Docker Compose Datei nicht gefunden: ${COMPOSE_FILE}"
        exit 1
    fi
    
    # Umgebungsdatei prüfen
    if [ ! -f "${SCRIPT_DIR}/${ENV_FILE}" ]; then
        print_error "Umgebungsdatei nicht gefunden: ${ENV_FILE}"
        print_info "Kopieren Sie .env.rub.example zu .env.rub und passen Sie die Konfiguration an"
        exit 1
    fi
    
    print_success "Alle Voraussetzungen erfüllt"
}

create_backup() {
    if [ "$BACKUP_BEFORE_UPDATE" = true ]; then
        print_info "Erstelle Backup vor Update..."
        
        if [ -f "${SCRIPT_DIR}/backup.rub.sh" ]; then
            chmod +x "${SCRIPT_DIR}/backup.rub.sh"
            "${SCRIPT_DIR}/backup.rub.sh"
            print_success "Backup erstellt"
        else
            print_warning "Backup-Script nicht gefunden. Update wird ohne Backup fortgesetzt."
            read -p "Möchten Sie fortfahren? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "Update abgebrochen."
                exit 0
            fi
        fi
    fi
}

check_database_connection() {
    print_info "Überprüfe Datenbankverbindung..."
    
    # Lade Umgebungsvariablen
    source "${SCRIPT_DIR}/${ENV_FILE}"
    
    # Teste Datenbankverbindung mit Docker
    if docker run --rm --network host mysql:8.0 mysql \
        -h"${DB_HOST}" \
        -P"${DB_PORT}" \
        -u"${DB_USER}" \
        -p"${DB_PASSWORD}" \
        -e "SELECT 1;" "${DB_NAME}" &>/dev/null; then
        print_success "Datenbankverbindung erfolgreich"
    else
        print_error "Datenbankverbindung fehlgeschlagen"
        print_info "Überprüfen Sie:"
        print_info "  • RUB-Datenbankserver ist erreichbar"
        print_info "  • Benutzername und Passwort sind korrekt"
        print_info "  • Firewall-Regeln erlauben Zugriff"
        print_info "  • SSL-Zertifikat ist gültig (falls verwendet)"
        print_info ""
        print_info "Kontakt RUB IT-Services: it-services@rub.de"
        exit 1
    fi
}

stop_services() {
    print_info "Stoppe laufende Services..."
    
    cd "${SCRIPT_DIR}"
    
    if docker-compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
        docker-compose -f "${COMPOSE_FILE}" down
        print_success "Services gestoppt"
    else
        print_info "Keine laufenden Services gefunden"
    fi
}

pull_latest_images() {
    print_info "Lade neueste Docker Images..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" pull
    
    print_success "Docker Images aktualisiert"
}

build_application() {
    print_info "Baue Anwendung neu..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" build --no-cache
    
    print_success "Anwendung neu gebaut"
}

start_services() {
    print_info "Starte Services..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" up -d
    
    print_success "Services gestartet"
}

wait_for_health_check() {
    print_info "Warte auf Health Check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "${COMPOSE_FILE}" ps | grep -q "healthy\|Up"; then
            print_success "Health Check erfolgreich"
            return 0
        fi
        
        print_info "Warte auf Services... (Versuch $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Health Check fehlgeschlagen nach $max_attempts Versuchen"
    return 1
}

verify_update() {
    print_info "Überprüfe Update..."
    
    # Lade Umgebungsvariablen
    source "${SCRIPT_DIR}/${ENV_FILE}"
    
    # Teste API-Endpoint
    local api_url="http://localhost:${PORT}/api/studies"
    
    if curl -f -s "$api_url" > /dev/null; then
        print_success "API ist erreichbar"
    else
        print_warning "API-Test fehlgeschlagen. Überprüfen Sie die Logs."
    fi
    
    # Zeige Container-Status
    print_info "Container-Status:"
    docker-compose -f "${COMPOSE_FILE}" ps
}

show_logs() {
    print_info "Aktuelle Logs (letzte 20 Zeilen):"
    docker-compose -f "${COMPOSE_FILE}" logs --tail=20
}

cleanup_old_images() {
    print_info "Bereinige alte Docker Images..."
    
    # Entferne ungenutzte Images
    docker image prune -f
    
    print_success "Alte Images bereinigt"
}

# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

main() {
    echo "============================================================================="
    echo "MentalMap-Tool - RUB Update Script"
    echo "============================================================================="
    echo ""
    
    print_info "Starte Update-Prozess..."
    
    # Voraussetzungen prüfen
    check_prerequisites
    
    # Backup erstellen
    create_backup
    
    # Datenbankverbindung testen
    check_database_connection
    
    # Services stoppen
    stop_services
    
    # Neueste Images laden
    pull_latest_images
    
    # Anwendung neu bauen
    build_application
    
    # Services starten
    start_services
    
    # Auf Health Check warten
    if ! wait_for_health_check; then
        print_error "Update möglicherweise fehlgeschlagen. Überprüfen Sie die Logs."
        show_logs
        exit 1
    fi
    
    # Update verifizieren
    verify_update
    
    # Alte Images bereinigen
    cleanup_old_images
    
    echo ""
    print_success "Update erfolgreich abgeschlossen!"
    echo ""
    print_info "Nützliche Befehle nach dem Update:"
    echo "  • Logs anzeigen: docker-compose -f ${COMPOSE_FILE} logs -f"
    echo "  • Status prüfen: docker-compose -f ${COMPOSE_FILE} ps"
    echo "  • Services neustarten: docker-compose -f ${COMPOSE_FILE} restart"
    echo "  • Services stoppen: docker-compose -f ${COMPOSE_FILE} down"
    echo ""
    print_info "Bei Problemen:"
    echo "  • Überprüfen Sie die Logs mit: docker-compose -f ${COMPOSE_FILE} logs"
    echo "  • Kontaktieren Sie RUB IT-Services: it-services@rub.de"
    echo "  • Stellen Sie bei Bedarf das Backup wieder her"
    echo ""
    echo "============================================================================="
}

# =============================================================================
# ROLLBACK-FUNKTION
# =============================================================================

rollback() {
    print_warning "Rollback wird durchgeführt..."
    
    # Services stoppen
    stop_services
    
    # Letztes Backup finden
    LATEST_BACKUP=$(find "${SCRIPT_DIR}/backups" -name "mentalmap-rub_backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
        print_info "Stelle Backup wieder her: $LATEST_BACKUP"
        
        # Backup extrahieren
        cd "${SCRIPT_DIR}"
        tar -xzf "$LATEST_BACKUP"
        
        # Services starten
        start_services
        
        print_success "Rollback abgeschlossen"
    else
        print_error "Kein Backup für Rollback gefunden"
        print_info "Manueller Rollback erforderlich"
    fi
}

# =============================================================================
# FEHLERBEHANDLUNG
# =============================================================================

trap 'print_error "Update fehlgeschlagen!"; print_info "Führen Sie Rollback durch mit: $0 rollback"; exit 1' ERR

# =============================================================================
# SCRIPT AUSFÜHREN
# =============================================================================

# Parameter verarbeiten
case "${1:-}" in
    "rollback")
        rollback
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "Verwendung: $0 [rollback]"
        echo ""
        echo "Optionen:"
        echo "  (keine)    - Führt Update durch"
        echo "  rollback   - Führt Rollback zum letzten Backup durch"
        echo "  help       - Zeigt diese Hilfe an"
        exit 0
        ;;
esac

# Überprüfen, ob Script als Root ausgeführt wird (nicht empfohlen)
if [ "$EUID" -eq 0 ]; then
    print_warning "Script wird als Root ausgeführt. Dies wird nicht empfohlen."
    read -p "Möchten Sie fortfahren? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Update abgebrochen."
        exit 0
    fi
fi

# Hauptprogramm ausführen
main "$@"