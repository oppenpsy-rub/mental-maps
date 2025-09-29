#!/bin/bash

# =============================================================================
# MentalMap-Tool - RUB Backup Script
# =============================================================================
# Backup-Script für Ruhr-Universität Bochum Deployment
# Hinweis: Datenbank-Backups werden von RUB IT-Services verwaltet
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
PROJECT_NAME="mentalmap-rub"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${SCRIPT_DIR}/backups"
BACKUP_FILE="${BACKUP_DIR}/${PROJECT_NAME}_backup_${TIMESTAMP}.tar.gz"

# Retention (Anzahl Tage, die Backups aufbewahrt werden)
RETENTION_DAYS=30

# =============================================================================
# FUNKTIONEN
# =============================================================================

create_backup_dir() {
    print_info "Erstelle Backup-Verzeichnis..."
    mkdir -p "${BACKUP_DIR}"
    print_success "Backup-Verzeichnis erstellt: ${BACKUP_DIR}"
}

check_docker_running() {
    print_info "Überprüfe Docker-Status..."
    if ! docker-compose -f docker-compose.rub.yml ps | grep -q "Up"; then
        print_warning "Container scheinen nicht zu laufen. Backup wird trotzdem erstellt."
    else
        print_success "Container laufen normal"
    fi
}

backup_application_data() {
    print_info "Erstelle Backup der Anwendungsdaten..."
    
    # Temporäres Verzeichnis für Backup-Inhalte
    TEMP_BACKUP_DIR="${BACKUP_DIR}/temp_${TIMESTAMP}"
    mkdir -p "${TEMP_BACKUP_DIR}"
    
    # Uploads sichern (falls vorhanden)
    if [ -d "${SCRIPT_DIR}/uploads" ]; then
        print_info "Sichere Upload-Dateien..."
        cp -r "${SCRIPT_DIR}/uploads" "${TEMP_BACKUP_DIR}/"
        print_success "Upload-Dateien gesichert"
    else
        print_warning "Uploads-Verzeichnis nicht gefunden"
    fi
    
    # Logs sichern (falls vorhanden)
    if [ -d "${SCRIPT_DIR}/logs" ]; then
        print_info "Sichere Log-Dateien..."
        cp -r "${SCRIPT_DIR}/logs" "${TEMP_BACKUP_DIR}/"
        print_success "Log-Dateien gesichert"
    else
        print_warning "Logs-Verzeichnis nicht gefunden"
    fi
    
    # Konfigurationsdateien sichern
    print_info "Sichere Konfigurationsdateien..."
    
    # RUB-spezifische Konfiguration
    if [ -f "${SCRIPT_DIR}/.env.rub" ]; then
        cp "${SCRIPT_DIR}/.env.rub" "${TEMP_BACKUP_DIR}/"
        print_success ".env.rub gesichert"
    fi
    
    # Docker-Compose-Dateien
    cp "${SCRIPT_DIR}/docker-compose.rub.yml" "${TEMP_BACKUP_DIR}/" 2>/dev/null || true
    cp "${SCRIPT_DIR}/Dockerfile" "${TEMP_BACKUP_DIR}/" 2>/dev/null || true
    
    # SSL-Zertifikate (falls vorhanden)
    if [ -d "${SCRIPT_DIR}/ssl" ]; then
        print_info "Sichere SSL-Zertifikate..."
        cp -r "${SCRIPT_DIR}/ssl" "${TEMP_BACKUP_DIR}/"
        print_success "SSL-Zertifikate gesichert"
    fi
    
    # Backup-Metadaten erstellen
    cat > "${TEMP_BACKUP_DIR}/backup_info.txt" << EOF
MentalMap-Tool RUB Backup
=========================
Backup erstellt: $(date)
Hostname: $(hostname)
Benutzer: $(whoami)
Docker-Compose Version: $(docker-compose --version)
Docker Version: $(docker --version)

Gesicherte Komponenten:
- Anwendungsdaten (uploads, logs)
- Konfigurationsdateien (.env.rub, docker-compose.rub.yml)
- SSL-Zertifikate (falls vorhanden)

HINWEIS: Datenbank-Backups werden von RUB IT-Services verwaltet.
Kontakt: it-services@rub.de

Backup-Datei: ${BACKUP_FILE}
EOF
    
    # Komprimiertes Backup erstellen
    print_info "Erstelle komprimiertes Backup..."
    cd "${BACKUP_DIR}"
    tar -czf "${BACKUP_FILE}" -C "temp_${TIMESTAMP}" .
    
    # Temporäres Verzeichnis löschen
    rm -rf "${TEMP_BACKUP_DIR}"
    
    print_success "Backup erstellt: ${BACKUP_FILE}"
}

cleanup_old_backups() {
    print_info "Bereinige alte Backups (älter als ${RETENTION_DAYS} Tage)..."
    
    find "${BACKUP_DIR}" -name "${PROJECT_NAME}_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    
    # Anzahl verbleibender Backups anzeigen
    BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "${PROJECT_NAME}_backup_*.tar.gz" -type f | wc -l)
    print_success "Bereinigung abgeschlossen. ${BACKUP_COUNT} Backups verbleiben."
}

show_backup_info() {
    print_info "Backup-Informationen:"
    echo "  Backup-Datei: ${BACKUP_FILE}"
    echo "  Größe: $(du -h "${BACKUP_FILE}" | cut -f1)"
    echo "  Erstellt: $(date)"
    echo ""
    print_info "Backup-Inhalt:"
    tar -tzf "${BACKUP_FILE}" | head -20
    if [ $(tar -tzf "${BACKUP_FILE}" | wc -l) -gt 20 ]; then
        echo "  ... und $(( $(tar -tzf "${BACKUP_FILE}" | wc -l) - 20 )) weitere Dateien"
    fi
}

# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

main() {
    echo "============================================================================="
    echo "MentalMap-Tool - RUB Backup Script"
    echo "============================================================================="
    echo ""
    
    print_info "Starte Backup-Prozess..."
    
    # Backup-Verzeichnis erstellen
    create_backup_dir
    
    # Docker-Status prüfen
    check_docker_running
    
    # Anwendungsdaten sichern
    backup_application_data
    
    # Alte Backups bereinigen
    cleanup_old_backups
    
    # Backup-Informationen anzeigen
    show_backup_info
    
    echo ""
    print_success "Backup erfolgreich abgeschlossen!"
    echo ""
    print_info "WICHTIGE HINWEISE:"
    echo "  • Datenbank-Backups werden von RUB IT-Services verwaltet"
    echo "  • Kontaktieren Sie it-services@rub.de für Datenbank-Wiederherstellung"
    echo "  • Testen Sie regelmäßig die Wiederherstellung Ihrer Backups"
    echo "  • Bewahren Sie wichtige Backups an einem sicheren Ort auf"
    echo ""
    print_info "Backup-Datei: ${BACKUP_FILE}"
    echo "============================================================================="
}

# =============================================================================
# FEHLERBEHANDLUNG
# =============================================================================

trap 'print_error "Backup fehlgeschlagen! Überprüfen Sie die Fehlermeldungen oben."; exit 1' ERR

# =============================================================================
# SCRIPT AUSFÜHREN
# =============================================================================

# Überprüfen, ob Script als Root ausgeführt wird (nicht empfohlen)
if [ "$EUID" -eq 0 ]; then
    print_warning "Script wird als Root ausgeführt. Dies wird nicht empfohlen."
    read -p "Möchten Sie fortfahren? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Backup abgebrochen."
        exit 0
    fi
fi

# Hauptprogramm ausführen
main "$@"