# 🚀 Mental Map Tool - RUB Deployment ohne Node.js

## Problem erkannt ❌
```bash
mentaxcb@vmits1050:/var/www/html/mentalmaps$ node --version
-bash: node: command not found
```

## ✅ Lösung: Portable Node.js Setup

Da Node.js nicht auf dem RUB-Server installiert ist, verwenden wir eine **portable Node.js Version**.

## 🎯 Schritt-für-Schritt Lösung

### 1. Alle Dateien hochladen (SFTP/SCP)

**Von Ihrem lokalen System aus:**
```bash
# Alle notwendigen Dateien hochladen
scp -r client/build/ mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/client/
scp -r server/ mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
scp -r node_modules/ mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
scp .env.production mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/.env
scp package.json mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
scp database_setup.sql mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
scp setup_nodejs_rub.sh mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
```

### 2. Setup-Script ausführen (SSH)

**Auf dem RUB-Server:**
```bash
ssh mentaxcb@dbs-lin.ruhr-uni-bochum.de
cd /var/www/html/mentalmaps

# Setup-Script ausführbar machen und starten
chmod +x setup_nodejs_rub.sh
bash setup_nodejs_rub.sh
```

**Das Script macht automatisch:**
- ✅ Sucht nach vorhandenen Node.js Installationen
- ✅ Lädt portable Node.js Version herunter (falls nötig)
- ✅ Entpackt und konfiguriert Node.js
- ✅ Startet die Mental Map Anwendung
- ✅ Erstellt Logs und PID-Datei

### 3. Datenbank einrichten

**MySQL-Setup:**
```bash
# MySQL-Passwort aus Datei lesen
cat ~/mysql.txt

# Datenbank-Setup ausführen
mysql -u mentalmapsadm -p mentalmaps < database_setup.sql
```

### 4. Webserver-Proxy konfigurieren

**Apache .htaccess erstellen:**
```bash
cd /var/www/html/mentalmaps
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

## 🔧 Manuelle Alternative (falls Script fehlschlägt)

### Option A: Manueller Node.js Download
```bash
cd /var/www/html/mentalmaps

# Node.js herunterladen
wget https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz

# Entpacken
tar -xf node-v18.17.1-linux-x64.tar.xz

# Symlink erstellen
ln -s node-v18.17.1-linux-x64/bin/node ./node

# Anwendung starten
nohup ./node server/index.production.js > logs/app.log 2>&1 &
echo $! > app.pid
```

### Option B: Lokaler Upload der Node.js Binaries
```bash
# Auf Ihrem lokalen System:
wget https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz
tar -xf node-v18.17.1-linux-x64.tar.xz

# Nur die Binaries hochladen
scp node-v18.17.1-linux-x64/bin/node mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
```

## 📋 Deployment-Checkliste

- [ ] **Dateien hochgeladen:** Alle Projektdateien per SFTP/SCP übertragen
- [ ] **Setup-Script:** `bash setup_nodejs_rub.sh` ausgeführt
- [ ] **Node.js verfügbar:** `./node --version` funktioniert
- [ ] **Datenbank:** MySQL-Setup mit `database_setup.sql` durchgeführt
- [ ] **Anwendung läuft:** Prozess auf Port 3003 aktiv
- [ ] **Webserver:** .htaccess Proxy-Konfiguration erstellt
- [ ] **Test:** URL https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps erreichbar
- [ ] **Login:** Admin-Zugang funktioniert (`admin@rub.de` / `admin123`)
- [ ] **Sicherheit:** Admin-Passwort geändert

## 🔍 Troubleshooting

### Problem: "wget: command not found"
```bash
# Alternative mit curl
curl -L https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz -o node-v18.17.1-linux-x64.tar.xz
```

### Problem: "tar: command not found"
```bash
# Laden Sie die Datei lokal herunter und entpacken Sie sie auf Ihrem System
# Dann laden Sie nur die node Binary hoch
```

### Problem: Port 3003 nicht erreichbar
```bash
# Prüfen ob Anwendung läuft
ps aux | grep node
cat logs/app.log

# Anwendung neu starten
kill $(cat app.pid)
nohup ./node server/index.production.js > logs/app.log 2>&1 &
echo $! > app.pid
```

### Problem: Berechtigungsfehler
```bash
# Berechtigungen setzen
chmod 755 /var/www/html/mentalmaps/
chmod +x node
chmod 600 .env
chmod 755 uploads/ logs/
```

## 🎯 Nächste Schritte

1. **Führen Sie das Setup-Script aus:** `bash setup_nodejs_rub.sh`
2. **Prüfen Sie die Logs:** `tail -f logs/app.log`
3. **Testen Sie die URL:** https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps
4. **Ändern Sie das Admin-Passwort** nach dem ersten Login

## 📞 Support-Kommandos

```bash
# Status prüfen
ps aux | grep node
netstat -tlnp | grep 3003

# Logs anzeigen
tail -f logs/app.log

# Anwendung stoppen
kill $(cat app.pid)

# Anwendung neu starten
nohup ./node server/index.production.js > logs/app.log 2>&1 &
echo $! > app.pid
```

---
**Status:** ✅ Bereit für Deployment ohne vorinstalliertes Node.js