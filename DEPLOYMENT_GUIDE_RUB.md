# Mental Map Tool - Deployment Guide für RUB-Server

## Übersicht
Diese Anleitung beschreibt das Deployment des Mental Map Tools auf den RUB-Server mittels FTP-Upload (Option A).

## Voraussetzungen

### Server-Anforderungen
- Node.js (Version 16 oder höher)
- MySQL-Datenbankserver
- FTP-Zugang zum RUB-Server
- Optional: SSH-Zugang für erweiterte Konfiguration

### Lokale Vorbereitung
- ✅ Produktions-Build erstellt (`client/build/` Ordner vorhanden)
- ✅ Produktions-Konfiguration vorbereitet (`.env.production`)
- ✅ Produktions-Server-Code erstellt (`server/index.production.js`)
- ✅ Datenbank-Setup-Script erstellt (`database_setup.sql`)

## Schritt 1: Datenbank einrichten

### 1.1 SQL-Script ausführen
1. Verbinden Sie sich mit dem RUB-MySQL-Server
2. Führen Sie das `database_setup.sql` Script aus:
   ```sql
   -- Führen Sie den Inhalt von database_setup.sql aus
   ```
3. Notieren Sie sich die Datenbankverbindungsparameter:
   - Host (z.B. `mysql.rub.de`)
   - Port (meist `3306`)
   - Datenbankname (z.B. `mentalmap`)
   - Benutzername
   - Passwort

## Schritt 2: Umgebungsvariablen konfigurieren

### 2.1 .env.production anpassen
Bearbeiten Sie die `.env.production` Datei und tragen Sie die echten RUB-Werte ein:

```env
# Datenbank - ECHTE RUB-Werte eintragen!
DB_HOST=IHR_RUB_DB_HOST
DB_PORT=3306
DB_USER=IHR_RUB_DB_USER
DB_PASSWORD=IHR_RUB_DB_PASSWORD
DB_NAME=mentalmap

# CORS - RUB-Domain eintragen
CORS_ORIGIN=https://IHR_DOMAIN.rub.de

# Sicherheit - STARKE SECRETS GENERIEREN!
SESSION_SECRET=GENERIEREN_SIE_EINEN_STARKEN_RANDOM_STRING
JWT_SECRET=GENERIEREN_SIE_EINEN_ANDEREN_STARKEN_RANDOM_STRING
```

**WICHTIG:** Generieren Sie starke, zufällige Secrets für Produktion!

### 2.2 Secrets generieren
Verwenden Sie einen Online-Generator oder Node.js:
```javascript
// In Node.js Console:
require('crypto').randomBytes(64).toString('hex')
```

## Schritt 3: Dateien per FTP hochladen

### 3.1 Verzeichnisstruktur auf dem Server
Erstellen Sie folgende Struktur auf dem RUB-Server:
```
/ihr-web-verzeichnis/
├── client/
│   └── build/          # React Build-Dateien
├── server/
│   ├── *.js           # Alle Server-Dateien
│   ├── node_modules/  # Nach npm install
│   └── package.json
├── uploads/           # Für Audio-Dateien
├── logs/             # Für Log-Dateien
├── .env.production   # Umgebungsvariablen
└── package.json      # Root package.json
```

### 3.2 Upload-Reihenfolge

#### A) Client-Dateien hochladen
```
Lokal: client/build/* 
→ Server: /ihr-web-verzeichnis/client/build/
```

#### B) Server-Dateien hochladen
```
Lokal: server/* 
→ Server: /ihr-web-verzeichnis/server/
```

#### C) Konfigurationsdateien hochladen
```
Lokal: .env.production 
→ Server: /ihr-web-verzeichnis/.env.production

Lokal: package.json 
→ Server: /ihr-web-verzeichnis/package.json
```

#### D) Verzeichnisse erstellen
Erstellen Sie leere Verzeichnisse:
- `/ihr-web-verzeichnis/uploads/`
- `/ihr-web-verzeichnis/logs/`

## Schritt 4: Server-Setup

### 4.1 Dependencies installieren
Verbinden Sie sich per SSH zum Server und führen Sie aus:
```bash
cd /ihr-web-verzeichnis
npm install --production

cd server
npm install --production
```

### 4.2 Berechtigungen setzen
```bash
chmod 755 /ihr-web-verzeichnis
chmod -R 755 uploads/
chmod -R 755 logs/
chmod 600 .env.production  # Nur Owner kann lesen
```

## Schritt 5: Anwendung starten

### 5.1 Test-Start
```bash
cd /ihr-web-verzeichnis
node server/index.production.js
```

### 5.2 Produktions-Start mit PM2 (empfohlen)
```bash
# PM2 installieren (falls nicht vorhanden)
npm install -g pm2

# Anwendung starten
pm2 start server/index.production.js --name "mentalmap-tool"

# Auto-Start bei Server-Neustart
pm2 startup
pm2 save
```

### 5.3 Alternative: systemd Service
Erstellen Sie `/etc/systemd/system/mentalmap.service`:
```ini
[Unit]
Description=Mental Map Tool
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/ihr-web-verzeichnis
ExecStart=/usr/bin/node server/index.production.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Dann:
```bash
sudo systemctl enable mentalmap
sudo systemctl start mentalmap
```

## Schritt 6: Webserver-Konfiguration

### 6.1 Nginx (empfohlen)
Erstellen Sie eine Nginx-Konfiguration:
```nginx
server {
    listen 80;
    server_name ihr-domain.rub.de;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ihr-domain.rub.de;
    
    # SSL-Konfiguration (RUB-spezifisch)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Serve static files directly
    location /static/ {
        alias /ihr-web-verzeichnis/client/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Serve uploads
    location /uploads/ {
        alias /ihr-web-verzeichnis/uploads/;
    }
    
    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve React app
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    location @fallback {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Apache Alternative
```apache
<VirtualHost *:80>
    ServerName ihr-domain.rub.de
    Redirect permanent / https://ihr-domain.rub.de/
</VirtualHost>

<VirtualHost *:443>
    ServerName ihr-domain.rub.de
    
    # SSL-Konfiguration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Serve static files
    Alias /static /ihr-web-verzeichnis/client/build/static
    Alias /uploads /ihr-web-verzeichnis/uploads
    
    # Proxy to Node.js
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3003/api/
    ProxyPassReverse /api/ http://localhost:3003/api/
    
    ProxyPass / http://localhost:3003/
    ProxyPassReverse / http://localhost:3003/
</VirtualHost>
```

## Schritt 7: Testen und Überwachung

### 7.1 Funktionstest
1. Öffnen Sie `https://ihr-domain.rub.de`
2. Testen Sie die Anmeldung mit: `admin@rub.de` / `admin123`
3. **WICHTIG:** Ändern Sie das Admin-Passwort sofort!
4. Testen Sie die Benutzerregistrierung
5. Testen Sie die Mental Map Funktionalität

### 7.2 Logs überwachen
```bash
# PM2 Logs
pm2 logs mentalmap-tool

# Systemd Logs
journalctl -u mentalmap -f

# Anwendungs-Logs
tail -f /ihr-web-verzeichnis/logs/mentalmap.log
```

### 7.3 Monitoring Setup
```bash
# PM2 Monitoring
pm2 monit

# Oder Web-Interface
pm2 web
```

## Schritt 8: Sicherheit und Wartung

### 8.1 Sicherheits-Checkliste
- [ ] Starke Passwörter für Datenbank und Admin-Account
- [ ] SSL/HTTPS aktiviert
- [ ] Firewall konfiguriert (nur Port 80, 443, SSH)
- [ ] Regelmäßige Backups eingerichtet
- [ ] Log-Rotation konfiguriert
- [ ] Updates geplant

### 8.2 Backup-Script
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mentalmap"

# Datenbank Backup
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Dateien Backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /ihr-web-verzeichnis/uploads/

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## Troubleshooting

### Häufige Probleme

#### Problem: "Cannot connect to database"
- Überprüfen Sie DB-Verbindungsparameter in `.env.production`
- Testen Sie Datenbankverbindung: `mysql -h HOST -u USER -p`

#### Problem: "Token expired" Fehler
- Überprüfen Sie JWT_SECRET in `.env.production`
- Löschen Sie Browser-Cache und Cookies

#### Problem: 502 Bad Gateway
- Überprüfen Sie ob Node.js läuft: `pm2 status`
- Überprüfen Sie Nginx/Apache Konfiguration

#### Problem: Uploads funktionieren nicht
- Überprüfen Sie Berechtigungen: `chmod -R 755 uploads/`
- Überprüfen Sie Speicherplatz: `df -h`

### Log-Analyse
```bash
# Fehler in Node.js Logs finden
grep -i error /ihr-web-verzeichnis/logs/mentalmap.log

# Nginx Fehler-Logs
tail -f /var/log/nginx/error.log

# System-Ressourcen überwachen
htop
```

## Support und Updates

### Update-Prozess
1. Neuen Code lokal builden
2. Backup erstellen
3. Neue Dateien per FTP hochladen
4. `pm2 restart mentalmap-tool`
5. Funktionalität testen

### Kontakt
Bei Problemen wenden Sie sich an das Entwicklungsteam oder erstellen Sie ein Issue im Repository.

---

**Wichtiger Hinweis:** Diese Anleitung ist spezifisch für den RUB-Server. Passen Sie Pfade, Domains und Konfigurationen entsprechend Ihrer RUB-Umgebung an.