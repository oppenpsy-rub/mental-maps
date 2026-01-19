#!/bin/bash
# Setup Script für portable Node.js auf RUB-Server
# Ausführen mit: bash setup_nodejs_rub.sh

echo "🚀 Mental Map Tool - Node.js Setup für RUB-Server"
echo "=================================================="

# Arbeitsverzeichnis
cd /var/www/html/mentalmaps

# 1. Prüfe alternative Node.js Pfade
echo "🔍 Suche nach vorhandenen Node.js Installationen..."

# Häufige Pfade für Node.js auf Linux-Servern
NODE_PATHS=(
    "/usr/bin/node"
    "/usr/local/bin/node"
    "/opt/node/bin/node"
    "/home/node/bin/node"
    "/usr/share/nodejs/bin/node"
    "$(which nodejs 2>/dev/null)"
)

for path in "${NODE_PATHS[@]}"; do
    if [ -x "$path" ]; then
        echo "✅ Node.js gefunden: $path"
        NODE_VERSION=$($path --version 2>/dev/null)
        echo "   Version: $NODE_VERSION"
        
        # Symlink erstellen falls nicht im PATH
        if ! command -v node &> /dev/null; then
            echo "📎 Erstelle Symlink..."
            ln -sf "$path" ./node
            export PATH="$PWD:$PATH"
        fi
        
        echo "🎉 Node.js ist bereit! Starte Anwendung..."
        exec "$path" server/index.production.js
        exit 0
    fi
done

echo "❌ Keine Node.js Installation gefunden."
echo "📦 Lade portable Node.js Version herunter..."

# 2. Portable Node.js herunterladen
NODE_VERSION="v18.17.1"
NODE_PACKAGE="node-${NODE_VERSION}-linux-x64"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_PACKAGE}.tar.xz"

echo "⬇️  Downloading: $NODE_URL"

# Download mit verschiedenen Tools versuchen
if command -v wget &> /dev/null; then
    wget -q --show-progress "$NODE_URL" -O "${NODE_PACKAGE}.tar.xz"
elif command -v curl &> /dev/null; then
    curl -L "$NODE_URL" -o "${NODE_PACKAGE}.tar.xz"
else
    echo "❌ Weder wget noch curl verfügbar!"
    echo "💡 Bitte laden Sie die Node.js Datei manuell hoch:"
    echo "   URL: $NODE_URL"
    echo "   Ziel: /var/www/html/mentalmaps/${NODE_PACKAGE}.tar.xz"
    exit 1
fi

# 3. Entpacken
echo "📂 Entpacke Node.js..."
if command -v tar &> /dev/null; then
    tar -xf "${NODE_PACKAGE}.tar.xz"
    
    # Symlinks erstellen
    ln -sf "${NODE_PACKAGE}/bin/node" ./node
    ln -sf "${NODE_PACKAGE}/bin/npm" ./npm
    
    # PATH erweitern
    export PATH="$PWD:$PATH"
    
    echo "✅ Portable Node.js installiert!"
    echo "📍 Node.js Pfad: $PWD/node"
    
    # Version prüfen
    NODE_VERSION=$(./node --version)
    echo "🔢 Version: $NODE_VERSION"
    
    # Aufräumen
    rm -f "${NODE_PACKAGE}.tar.xz"
    
else
    echo "❌ tar nicht verfügbar zum Entpacken!"
    echo "💡 Bitte entpacken Sie manuell:"
    echo "   tar -xf ${NODE_PACKAGE}.tar.xz"
    exit 1
fi

# 4. Anwendung starten
echo "🚀 Starte Mental Map Tool..."
echo "📊 Logs werden in logs/app.log gespeichert"

# Verzeichnisse erstellen
mkdir -p logs uploads
chmod 755 logs uploads

# Anwendung im Hintergrund starten
nohup ./node server/index.production.js > logs/app.log 2>&1 &
APP_PID=$!

echo "✅ Anwendung gestartet!"
echo "🆔 Prozess-ID: $APP_PID"
echo "📝 Logs: tail -f logs/app.log"
echo "🌐 URL: https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps"

# PID speichern für späteren Stop
echo $APP_PID > app.pid

echo ""
echo "🎯 Setup abgeschlossen!"
echo "📋 Nächste Schritte:"
echo "   1. Webserver-Proxy konfigurieren (Port 3003)"
echo "   2. URL testen: https://www.dbs-lin.ruhr-uni-bochum.de/mentalmaps"
echo "   3. Admin-Login: admin@rub.de / admin123"
echo "   4. Admin-Passwort ändern!"
echo ""
echo "🛑 Anwendung stoppen: kill \$(cat app.pid)"