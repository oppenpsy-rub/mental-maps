# MentalMap-Tool - RUB Integration Guide

## 🎓 Ruhr-Universität Bochum MySQL Integration

Dieses Dokument beschreibt die Integration des MentalMap-Tools mit dem MySQL-Datenbankserver der Ruhr-Universität Bochum.

## 📋 Voraussetzungen

### RUB IT-Services Kontakt
- **E-Mail**: it-services@rub.de
- **Web**: https://www.it-services.ruhr-uni-bochum.de/
- **Telefon**: +49 234 32-28282

### Benötigte Informationen vom RUB IT-Service
1. **MySQL-Server Hostname** (z.B. `dbs.rub.de`)
2. **Port** (Standard: 3306)
3. **Datenbankname** für Ihr Projekt
4. **Benutzername und Passwort**
5. **SSL-Zertifikat** (falls erforderlich)
6. **Firewall-Regeln** (IP-Whitelist)

## 🚀 Schnellstart

### 1. Konfiguration vorbereiten
```bash
# RUB-Konfiguration kopieren
cp .env.rub.example .env.rub

# Konfiguration anpassen (siehe unten)
nano .env.rub
```

### 2. RUB-Datenbankdaten eintragen
Bearbeiten Sie die Datei `.env.rub`:

```bash
# RUB MySQL Datenbank-Konfiguration
DB_HOST=dbs.rub.de                    # Vom RUB IT-Service erhalten
DB_PORT=3306                          # Vom RUB IT-Service erhalten
DB_USER=ihr_rub_username              # Ihr RUB-Datenbankbenutzer
DB_PASSWORD=ihr_rub_passwort          # Ihr RUB-Datenbankpasswort
DB_NAME=ihr_datenbankname             # Ihre RUB-Datenbank

# Sicherheit (WICHTIG: Ändern!)
JWT_SECRET=ihr-sicherer-jwt-schluessel
SESSION_SECRET=ihr-sicherer-session-schluessel

# Domain anpassen
CORS_ORIGIN=https://ihr-domain.rub.de
```

### 3. SSL-Zertifikat (falls erforderlich)
```bash
# SSL-Verzeichnis erstellen
mkdir -p ssl

# CA-Zertifikat von RUB IT-Services herunterladen
# und als ssl/rub-ca.pem speichern
```

### 4. Deployment starten
```bash
# RUB-spezifisches Deployment
chmod +x deploy.rub.sh
./deploy.rub.sh production
```

## 📁 RUB-spezifische Dateien

### Konfigurationsdateien
- **`.env.rub`** - RUB-spezifische Umgebungsvariablen
- **`docker-compose.rub.yml`** - Docker-Konfiguration ohne lokale MySQL
- **`deploy.rub.sh`** - RUB-Deployment-Script
- **`backup.rub.sh`** - RUB-Backup-Script (ohne DB-Backup)
- **`update.rub.sh`** - RUB-Update-Script

### SSL-Zertifikate
```
ssl/
├── rub-ca.pem          # RUB CA-Zertifikat
└── client-cert.pem     # Client-Zertifikat (falls erforderlich)
```

## 🔧 Konfiguration im Detail

### Datenbankverbindung
```bash
# Basis-Konfiguration
DB_TYPE=mysql
DB_HOST=dbs.rub.de
DB_PORT=3306
DB_USER=ihr_username
DB_PASSWORD=ihr_passwort
DB_NAME=ihr_datenbankname

# SSL-Konfiguration
DB_SSL=true
DB_SSL_CA_PATH=/app/ssl/rub-ca.pem

# Verbindungsoptionen
DB_CONNECTION_LIMIT=10
DB_TIMEOUT=60000
```

### Sicherheitseinstellungen
```bash
# JWT und Session (WICHTIG: Ändern!)
JWT_SECRET=generieren-sie-einen-sicheren-schluessel
SESSION_SECRET=generieren-sie-einen-sicheren-schluessel

# CORS für RUB-Domain
CORS_ORIGIN=https://ihr-projekt.rub.de
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Institutionelle Einstellungen
```bash
# RUB-spezifische Konfiguration
INSTITUTION=Ruhr-Universitaet-Bochum
DEPARTMENT=Ihr-Fachbereich
PROJECT_NAME=MentalMap-Tool

# Teilnehmer-Codes mit RUB-Präfix
PARTICIPANT_CODE_PREFIX=RUB
```

## 🐳 Docker-Deployment

### RUB-Docker-Compose
Die Datei `docker-compose.rub.yml` ist speziell für die RUB-Umgebung konfiguriert:

- **Keine lokale MySQL-Instanz** (nutzt RUB-Server)
- **SSL-Zertifikat-Mounting** für sichere Datenbankverbindung
- **Erweiterte Health-Checks** mit längeren Timeouts
- **RUB-spezifische Umgebungsvariablen**

### Deployment-Befehle
```bash
# Starten
docker-compose -f docker-compose.rub.yml up -d

# Logs anzeigen
docker-compose -f docker-compose.rub.yml logs -f

# Stoppen
docker-compose -f docker-compose.rub.yml down

# Neustarten
docker-compose -f docker-compose.rub.yml restart
```

## 🔒 Sicherheit

### SSL/TLS-Verbindung
```bash
# SSL aktivieren
DB_SSL=true
DB_SSL_CA_PATH=/app/ssl/rub-ca.pem

# CA-Zertifikat von RUB IT-Services anfordern
# Speichern als: ssl/rub-ca.pem
```

### Firewall-Konfiguration
- **IP-Whitelist** beim RUB IT-Service beantragen
- **VPN-Zugang** falls erforderlich
- **Port 3306** für MySQL-Verbindung

### Passwort-Sicherheit
```bash
# Sichere Passwörter generieren
openssl rand -base64 32  # Für JWT_SECRET
openssl rand -base64 32  # Für SESSION_SECRET
```

## 📦 Backup-Strategie

### Was wird gesichert
- **Uploads** (Audio-Dateien, Dokumente)
- **Logs** (Anwendungslogs)
- **Konfiguration** (Umgebungsvariablen)

### Was NICHT gesichert wird
- **Datenbank** (wird von RUB IT-Services verwaltet)

### Backup-Befehle
```bash
# Automatisches Backup
./backup.rub.sh

# Manuelles Backup
tar -czf backup_$(date +%Y%m%d).tar.gz uploads/ logs/ .env.rub
```

## 🔧 Troubleshooting

### Häufige Probleme

#### Datenbankverbindung fehlgeschlagen
```bash
# Verbindung testen
docker-compose -f docker-compose.rub.yml exec mentalmap node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).then(() => console.log('✅ Verbindung erfolgreich'))
.catch(err => console.error('❌ Verbindung fehlgeschlagen:', err));
"
```

#### SSL-Zertifikat-Probleme
```bash
# Zertifikat überprüfen
openssl x509 -in ssl/rub-ca.pem -text -noout

# Zertifikat-Pfad überprüfen
docker-compose -f docker-compose.rub.yml exec mentalmap ls -la /app/ssl/
```

#### Firewall-Probleme
```bash
# Externe IP-Adresse ermitteln
curl ifconfig.me

# Diese IP beim RUB IT-Service für Whitelist angeben
```

### Log-Analyse
```bash
# Anwendungslogs
docker-compose -f docker-compose.rub.yml logs mentalmap

# Datenbankverbindungs-Logs
grep -i "mysql\|database" logs/mentalmap.log

# Fehler-Logs
grep -i "error\|failed" logs/mentalmap.log
```

## 📞 Support

### RUB IT-Services
- **E-Mail**: it-services@rub.de
- **Telefon**: +49 234 32-28282
- **Web**: https://www.it-services.ruhr-uni-bochum.de/

### Häufige Anfragen an RUB IT-Services
1. **Datenbankzugang** für Forschungsprojekt beantragen
2. **SSL-Zertifikat** für sichere Verbindung anfordern
3. **IP-Whitelist** für Server-Zugang einrichten
4. **Backup-Richtlinien** für Forschungsdaten erfragen
5. **Compliance** und DSGVO-Konformität klären

### Projekt-Support
- **GitHub Issues**: Für technische Probleme
- **E-Mail**: Für projektspezifische Fragen
- **Dokumentation**: README.md für allgemeine Informationen

## 🎯 Produktions-Checkliste

### Vor dem Go-Live
- [ ] RUB-Datenbankzugang erhalten und getestet
- [ ] SSL-Zertifikate installiert und validiert
- [ ] Sichere Passwörter für JWT/Session generiert
- [ ] CORS-Origin für Produktions-Domain konfiguriert
- [ ] Firewall-Regeln mit RUB IT-Services abgestimmt
- [ ] Backup-Strategie implementiert und getestet
- [ ] Health-Checks funktionieren
- [ ] Logs werden korrekt geschrieben
- [ ] Upload-Verzeichnis ist beschreibbar
- [ ] Domain und SSL-Zertifikat für Frontend konfiguriert

### Nach dem Go-Live
- [ ] Monitoring eingerichtet
- [ ] Regelmäßige Backups geplant
- [ ] Update-Strategie definiert
- [ ] Support-Kontakte dokumentiert
- [ ] Benutzer-Dokumentation erstellt
- [ ] Performance-Monitoring aktiviert

## 📈 Monitoring

### Health-Check URLs
- **API Status**: `http://ihr-server:3003/api/studies`
- **Datenbankverbindung**: Über Anwendungslogs prüfen
- **Upload-Funktionalität**: Testdatei hochladen

### Log-Monitoring
```bash
# Echtzeitlogs
tail -f logs/mentalmap.log

# Fehler-Monitoring
grep -i error logs/mentalmap.log | tail -20

# Datenbankverbindungen
grep -i "mysql\|connection" logs/mentalmap.log
```

---

**Viel Erfolg mit Ihrem MentalMap-Tool an der Ruhr-Universität Bochum! 🎓**