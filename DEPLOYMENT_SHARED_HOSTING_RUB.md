# Mental Map Tool - Shared Hosting Deployment für RUB (ohne npm)

## 🎯 Lösung für Shared Hosting ohne npm/Node.js Installation

Da auf dem RUB-Server keine npm-Installation möglich ist, verwenden wir eine **Pre-compiled Deployment-Strategie**.

## ✅ Vorbereitung (bereits erledigt)

- ✅ Alle `node_modules` sind lokal installiert
- ✅ Client-Build ist erstellt (`client/build/`)
- ✅ Produktions-Konfiguration ist bereit (`.env.production`)

## 📦 Upload-Struktur für Shared Hosting

### Vollständige Verzeichnisstruktur zum Upload:
```
/var/www/html/mentalmaps/           # Ihr Web-Verzeichnis
├── client/
│   └── build/                      # Kompletter React-Build
│       ├── static/
│       ├── index.html
│       └── ...
├── server/
│   ├── node_modules/               # ⭐ Lokal installierte Dependencies
│   ├── *.js                       # Alle Server-Dateien
│   └── package.json
├── node_modules/                   # ⭐ Root-Dependencies
├── uploads/                        # Leeres Verzeichnis (chmod 755)
├── logs/                          # Leeres Verzeichnis (chmod 755)
├── .env                           # Umbenannt von .env.production
├── package.json                   # Root package.json
└── database_setup.sql             # Für Datenbank-Setup
```

## 🚀 Schritt-für-Schritt Deployment

### 1. Datenbank einrichten
```bash
# SSH zum RUB-Server
ssh mentaxcb@dbs-lin.ruhr-uni-bochum.de

# MySQL-Zugang prüfen (Passwort in ~/mysql.txt)
cat ~/mysql.txt
mysql -u mentalmapsadm -p mentalmaps

# Datenbank-Setup ausführen
# (database_setup.sql Inhalt manuell in MySQL eingeben)
```

### 2. FTP/SFTP Upload (Komplette Verzeichnisse)

**Wichtig:** Laden Sie ALLE Verzeichnisse inklusive `node_modules` hoch!

```bash
# Via SFTP/SCP von Ihrem lokalen System:
scp -r client/build/ mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/client/
scp -r server/ mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
scp -r node_modules/ mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
scp .env.production mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/.env
scp package.json mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
scp database_setup.sql mentaxcb@dbs-lin.ruhr-uni-bochum.de:/var/www/html/mentalmaps/
```

### 3. Server-Setup (SSH erforderlich)
```bash
# SSH zum Server
ssh mentaxcb@dbs-lin.ruhr-uni-bochum.de
cd /var/www/html/mentalmaps

# Verzeichnisse erstellen und Berechtigungen setzen
mkdir -p uploads logs
chmod 755 uploads/ logs/
chmod 600 .env

# Node.js Version prüfen
node --version
# Falls Node.js nicht verfügbar: Alternative Lösungen erforderlich
```

### 4. Node.js Verfügbarkeit prüfen

**Testen Sie auf dem RUB-Server:**
```bash
# Node.js verfügbar?
which node
node --version

# Falls nicht verfügbar, prüfen Sie alternative Pfade:
/usr/local/bin/node --version
/opt/node/bin/node --version

# Oder laden Sie eine portable Node.js Version hoch
```

## 🔧 Alternative Lösungen falls Node.js nicht verfügbar

### Option A: Portable Node.js
```bash
# Laden Sie eine portable Node.js Version hoch
wget https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz
tar -xf node-v18.17.0-linux-x64.tar.xz
export PATH=$PWD/node-v18.17.0-linux-x64/bin:$PATH
```

### Option B: PHP-Proxy (falls nur PHP verfügbar)
Erstellen Sie eine PHP-Datei als Proxy zu einer externen Node.js-Instanz.

### Option C: Static Files + API Gateway
Nutzen Sie nur die statischen Client-Dateien und einen externen API-Service.

## 🚀 Anwendung starten (wenn Node.js verfügbar)

```bash
cd /var/www/html/mentalmaps

# Direkt starten (Vordergrund)
node server/index.production.js

# Oder im Hintergrund mit nohup
nohup node server/index.production.js > logs/app.log 2>&1 &

# Prozess-ID speichern
echo $! > app.pid
```

## 🌐 Webserver-Konfiguration

### Apache .htaccess (falls Apache verwendet)
Erstellen Sie `/var/www/html/mentalmaps/.htaccess`:
```apache
RewriteEngine On

# API-Requests an Node.js weiterleiten
RewriteRule ^api/(.*)$ http://localhost:3003/api/$1 [P,L]

# Alle anderen Requests an React-App
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /mentalmaps/client/build/index.html [L]

# Statische Dateien direkt servieren
RewriteRule ^client/build/(.*)$ client/build/$1 [L]
```

### Nginx (falls verfügbar)
```nginx
location /mentalmaps {
    # Statische Dateien
    location /mentalmaps/client/build/ {
        alias /var/www/html/mentalmaps/client/build/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API-Requests
    location /mentalmaps/api/ {
        proxy_pass http://localhost:3003/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # React-App
    try_files $uri $uri/ /mentalmaps/client/build/index.html;
}
```

## 📋 Deployment-Checkliste

- [ ] **Datenbank:** MySQL-Zugang getestet (`mysql -u mentalmapsadm -p mentalmaps`)
- [ ] **Upload:** Alle Dateien inklusive `node_modules` hochgeladen
- [ ] **Konfiguration:** `.env.production` zu `.env` umbenannt
- [ ] **Berechtigungen:** `uploads/` und `logs/` Verzeichnisse erstellt (chmod 755)
- [ ] **Node.js:** Verfügbarkeit geprüft (`node --version`)
- [ ] **Start:** Anwendung gestartet (`node server/index.production.js`)
- [ ] **Webserver:** Proxy-Konfiguration eingerichtet
- [ ] **Test:** URL https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps erreichbar
- [ ] **Login:** Admin-Login funktioniert (`admin@rub.de` / `admin123`)
- [ ] **Sicherheit:** Admin-Passwort geändert

## 🔍 Troubleshooting

### Problem: "npm: command not found"
✅ **Lösung:** Verwenden Sie die pre-compiled `node_modules` (bereits erledigt)

### Problem: "node: command not found"
```bash
# Suchen Sie nach Node.js
find /usr -name "node" 2>/dev/null
find /opt -name "node" 2>/dev/null

# Oder installieren Sie portable Version
wget https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz
```

### Problem: Berechtigungsfehler
```bash
# Berechtigungen prüfen und setzen
ls -la /var/www/html/mentalmaps/
chmod -R 755 /var/www/html/mentalmaps/
chmod 600 /var/www/html/mentalmaps/.env
```

### Problem: Port 3003 nicht erreichbar
```bash
# Prüfen ob Port belegt ist
netstat -tlnp | grep 3003

# Firewall-Regeln prüfen
iptables -L | grep 3003
```

## 📞 Nächste Schritte

1. **Testen Sie Node.js Verfügbarkeit** auf dem RUB-Server
2. **Laden Sie alle Dateien hoch** (inklusive `node_modules`)
3. **Konfigurieren Sie den Webserver** als Proxy
4. **Starten Sie die Anwendung** mit Node.js

---
**Status:** ✅ Bereit für Shared Hosting Deployment ohne npm-Installation