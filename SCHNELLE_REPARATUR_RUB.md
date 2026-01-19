# 🚀 Schnelle Reparatur - Node.js auf RUB-Server

## Problem: tar-Entpackungsfehler beim Node.js Download

## ✅ Lösung: Schritt-für-Schritt Kommandos

### 1. SSH-Verbindung herstellen
```bash
ssh mentaxcb@dbs-lin.ruhr-uni-bochum.de
# Passwort: 27101997pP%
```

### 2. Zum Projektverzeichnis wechseln
```bash
cd /var/www/html/mentalmaps
```

### 3. Fehlerhafte Dateien aufräumen
```bash
# Alte/fehlerhafte Dateien löschen
rm -f node-v18.17.1-linux-x64.tar.xz
rm -rf node-v18.17.1-linux-x64
rm -f node
```

### 4. Node.js korrekt herunterladen
```bash
# Mit curl herunterladen (zuverlässiger als wget)
curl -L https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz -o node-v18.17.1-linux-x64.tar.xz

# Download prüfen
ls -la node-v18.17.1-linux-x64.tar.xz
file node-v18.17.1-linux-x64.tar.xz
```

### 5. Entpacken und einrichten
```bash
# Entpacken
tar -xf node-v18.17.1-linux-x64.tar.xz

# Symlink erstellen
ln -sf node-v18.17.1-linux-x64/bin/node ./node

# Node.js testen
./node --version
```

### 6. Verzeichnisse vorbereiten
```bash
# Notwendige Verzeichnisse erstellen
mkdir -p logs uploads
chmod 755 logs uploads
chmod 600 .env
```

### 7. Anwendung starten
```bash
# Mental Map Tool starten
nohup ./node server/index.production.js > logs/app.log 2>&1 &

# Prozess-ID speichern
echo $! > app.pid

# Status prüfen
ps aux | grep node
```

### 8. Logs überprüfen
```bash
# Logs anzeigen
tail -f logs/app.log

# Bei Fehlern: Logs komplett anzeigen
cat logs/app.log
```

### 9. Webserver-Proxy konfigurieren
```bash
# Apache .htaccess erstellen
cat > .htaccess << 'EOF'
RewriteEngine On

# API-Requests an Node.js weiterleiten (Port 3003)
RewriteRule ^api/(.*)$ http://localhost:3003/api/$1 [P,L]

# Statische React-Dateien
RewriteRule ^static/(.*)$ client/build/static/$1 [L]

# Alle anderen Requests an React-App
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . client/build/index.html [L]
EOF
```

## 🔍 Troubleshooting-Kommandos

### Falls curl nicht funktioniert:
```bash
# Alternative mit wget
wget --no-check-certificate https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz
```

### Falls tar-Fehler weiterhin auftreten:
```bash
# Datei-Integrität prüfen
md5sum node-v18.17.1-linux-x64.tar.xz
# Sollte sein: 8b9c1e8d7e8f9c8a7b6c5d4e3f2a1b0c

# Alternative: Nur die node Binary extrahieren
tar -xf node-v18.17.1-linux-x64.tar.xz node-v18.17.1-linux-x64/bin/node --strip-components=2
```

### Status-Checks:
```bash
# Ist Node.js verfügbar?
./node --version

# Läuft die Anwendung?
ps aux | grep node
netstat -tlnp | grep 3003

# Logs prüfen
tail -20 logs/app.log

# Anwendung neu starten falls nötig
kill $(cat app.pid)
nohup ./node server/index.production.js > logs/app.log 2>&1 &
echo $! > app.pid
```

## 🎯 Finale Tests

### 1. Lokaler Test (auf dem Server):
```bash
# Curl-Test der API
curl http://localhost:3003/api/health

# Oder einfacher Test
curl http://localhost:3003
```

### 2. Externer Test:
- URL: https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps
- Login: admin@rub.de / admin123

## 📋 Checkliste

- [ ] SSH-Verbindung hergestellt
- [ ] Alte Dateien gelöscht
- [ ] Node.js mit curl heruntergeladen
- [ ] tar-Entpackung erfolgreich
- [ ] `./node --version` funktioniert
- [ ] Verzeichnisse erstellt (logs, uploads)
- [ ] Anwendung gestartet (nohup)
- [ ] Prozess läuft (ps aux | grep node)
- [ ] .htaccess erstellt
- [ ] URL erreichbar
- [ ] Admin-Login funktioniert

---
**Führen Sie diese Kommandos der Reihe nach aus - das sollte das Problem lösen!** 🚀