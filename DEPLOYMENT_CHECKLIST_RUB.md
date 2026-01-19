# Mental Map Tool - Finale Deployment-Checkliste für RUB

## ✅ Vorbereitung abgeschlossen

Alle notwendigen Dateien sind mit den korrekten RUB-Werten konfiguriert:

### Konfigurationsdateien:
- ✅ `.env.production` - Mit echten RUB-Datenbankwerten konfiguriert
- ✅ `database_setup.sql` - Für Datenbank 'mentalmaps' angepasst
- ✅ `server/index.production.js` - Produktions-optimierte Server-Version
- ✅ `client/build/` - React-Build erstellt (176.94 kB)

### RUB-spezifische Konfiguration:
- **URL:** https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps
- **Datenbank:** mentalmaps
- **DB-Benutzer:** mentalmapsadm
- **Starke Secrets:** ✅ Generiert und eingetragen

## 🚀 Nächste Schritte für FTP-Upload

### 1. Datenbank einrichten
```sql
-- Führen Sie database_setup.sql auf dem RUB-MySQL-Server aus
-- Die Datei ist bereits für 'mentalmaps' Datenbank konfiguriert
```

### 2. FTP-Upload Struktur
```
/mentalmaps/                    # Ihr Web-Verzeichnis
├── client/
│   └── build/                  # Alle Dateien aus client/build/
├── server/
│   ├── *.js                   # Alle Server-Dateien
│   └── package.json           # server/package.json
├── uploads/                   # Leeres Verzeichnis erstellen
├── logs/                      # Leeres Verzeichnis erstellen
├── .env.production            # Umbenannt zu .env
├── package.json               # Root package.json
└── node_modules/              # Nach npm install
```

### 3. Upload-Reihenfolge
1. **Client-Build hochladen:**
   - `client/build/*` → `/mentalmaps/client/build/`

2. **Server-Dateien hochladen:**
   - `server/*` → `/mentalmaps/server/`
   - `package.json` → `/mentalmaps/package.json`

3. **Konfiguration hochladen:**
   - `.env.production` → `/mentalmaps/.env` ⚠️ **Umbenennen zu .env**

4. **Verzeichnisse erstellen:**
   - `/mentalmaps/uploads/` (chmod 755)
   - `/mentalmaps/logs/` (chmod 755)

### 4. Server-Setup (SSH erforderlich)
```bash
cd /mentalmaps

# Dependencies installieren
npm install --production
cd server && npm install --production && cd ..

# Berechtigungen setzen
chmod 755 uploads/ logs/
chmod 600 .env

# Anwendung starten
node server/index.production.js
# Oder mit PM2: pm2 start server/index.production.js --name "mentalmap-tool"
```

### 5. Webserver-Konfiguration
Die Anwendung läuft auf Port 3003. Konfigurieren Sie Ihren Webserver (Apache/Nginx) als Reverse Proxy:

**Nginx Beispiel:**
```nginx
location /mentalmaps {
    proxy_pass http://localhost:3003;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 6. Test nach Deployment
1. Öffnen Sie: https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps
2. Testen Sie Login mit: `admin@rub.de` / `admin123`
3. **WICHTIG:** Ändern Sie das Admin-Passwort sofort!

## 📋 Finale Checkliste

- [ ] Datenbank 'mentalmaps' auf RUB-Server erstellt
- [ ] `database_setup.sql` ausgeführt
- [ ] Alle Dateien per FTP hochgeladen
- [ ] `.env.production` zu `.env` umbenannt
- [ ] Dependencies installiert (`npm install --production`)
- [ ] Berechtigungen gesetzt (uploads/, logs/, .env)
- [ ] Anwendung gestartet (Node.js läuft auf Port 3003)
- [ ] Webserver als Reverse Proxy konfiguriert
- [ ] URL https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps erreichbar
- [ ] Admin-Login funktioniert
- [ ] Admin-Passwort geändert
- [ ] Benutzerregistrierung getestet
- [ ] Mental Map Funktionalität getestet

## 🔧 Troubleshooting

**Problem: Datenbankverbindung fehlgeschlagen**
- Überprüfen Sie, ob die Datenbank 'mentalmaps' existiert
- Testen Sie: `mysql -u mentalmapsadm -p mentalmaps`

**Problem: 502 Bad Gateway**
- Überprüfen Sie, ob Node.js läuft: `ps aux | grep node`
- Überprüfen Sie Logs: `tail -f logs/mentalmap.log`

**Problem: CORS-Fehler**
- Überprüfen Sie CORS_ORIGIN in .env: `https://www.dbs-lin.ruhr-uni-bochum.de`

## 📞 Support
Bei Problemen konsultieren Sie die detaillierte `DEPLOYMENT_GUIDE_RUB.md` oder wenden Sie sich an das Entwicklungsteam.

---
**Status:** ✅ Bereit für Deployment auf https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps