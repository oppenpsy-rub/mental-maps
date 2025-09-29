# 🗺️ MentalMap-Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

Ein professionelles, webbasiertes Tool für linguistische und geografische Perzeptionsstudien mit interaktiven Kartenzeichnungen und Audio-Wahrnehmungsforschung.

## 🎓 Entwickelt an der Ruhr-Universität Bochum

Dieses Tool wurde für die Forschung in der Linguistik und kognitiven Geografie entwickelt und ermöglicht es Forschern, mentale Karten und Sprachwahrnehmung systematisch zu erfassen und zu analysieren.

## ✨ Features

### 🎯 **Hauptfunktionen**
- **Interaktive Kartenzeichnung** mit freihand Polygon-Zeichnung
- **Audio-Wahrnehmungsstudien** mit Audio-Upload und -Wiedergabe
- **Flexible Studienkonfiguration** mit eigenen Fragen
- **Teilnehmer-Code-Generierung** für LimeSurvey-Integration
- **Daten-Export** für QGIS, Excel und SPSS

### 🛠️ **Technische Features**
- **React.js Frontend** mit moderner UI
- **Node.js/Express Backend** mit SQLite-Datenbank
- **OpenStreetMap Integration** (quelloffen)
- **GeoJSON-Export** für QGIS-Analyse
- **CSV-Export** für statistische Analysen
- **Audio-Upload** und -Verwaltung

## 🚀 Quick Start

### Voraussetzungen
- Node.js (Version 14 oder höher)
- npm oder yarn

### Installation

1. **Repository klonen**
```bash
git clone <repository-url>
cd mentalmap-prototype
```

2. **Dependencies installieren**
```bash
# Root-Dependencies
npm install

# Backend-Dependencies
cd server
npm install

# Frontend-Dependencies
cd ../client
npm install
```

3. **Anwendung starten**
```bash
# Zurück ins Root-Verzeichnis
cd ..

# Backend starten (Terminal 1)
cd server
npm start

# Frontend starten (Terminal 2)
cd client
npm start
```

4. **Anwendung öffnen**
- Frontend: http://localhost:3000
- Backend: http://localhost:3003

## 📖 Benutzerhandbuch

### 🎨 **Für Teilnehmer**

1. **Umfrage starten**
   - Öffnen Sie http://localhost:3000
   - Teilnehmer-Code wird automatisch generiert
   - Notieren Sie sich den Code für LimeSurvey

2. **Polygone zeichnen**
   - Klicken Sie "Zeichnen starten"
   - Halten Sie die Maus gedrückt und zeichnen Sie
   - Lassen Sie die Maus los → Polygon wird geschlossen
   - Wiederholen Sie für mehrere Polygone

3. **Einzelne Polygone löschen**
   - Fahren Sie über ein Polygon (wird rot)
   - Klicken Sie darauf zum Löschen

4. **Audio-Fragen**
   - Hören Sie sich das Audio an
   - Zeichnen Sie die vermutete Region

### 🔧 **Für Administratoren**

#### **Audio-Dateien verwalten**
1. Klicken Sie "🎵 Audio" in der Hauptansicht
2. Laden Sie MP3, WAV oder OGG Dateien hoch
3. Testen Sie die Audio-Wiedergabe
4. Löschen Sie nicht mehr benötigte Dateien

#### **Studien erstellen und verwalten**
1. Klicken Sie "📊 Studien" in der Hauptansicht
2. Erstellen Sie eine neue Studie oder bearbeiten Sie bestehende
3. Fügen Sie Fragen hinzu:
   - **Karten-Zeichnung**: Normale Polygon-Fragen
   - **Audio-Wahrnehmung**: Fragen mit Audio-Dateien
4. Konfigurieren Sie Polygon-Limits (1, 3, 5, 10 Polygone)
5. Speichern Sie die Studie

#### **Daten exportieren**
1. Wählen Sie eine Studie aus
2. Klicken Sie "📊 Daten exportieren"
3. Laden Sie herunter:
   - **GeoJSON**: Für QGIS-Analyse
   - **CSV**: Für Excel/SPSS-Analyse
4. Kopieren Sie Teilnehmer-Codes für LimeSurvey

## 🗂️ Datenstruktur

### **Datenbank-Schema**
```sql
-- Studien
studies (id, name, config, created_at)

-- Teilnehmer
participants (id, code, study_id, limesurvey_id, created_at)

-- Antworten
responses (id, participant_id, question_id, geometry, audio_file, created_at)
```

### **Export-Formate**

#### **GeoJSON für QGIS**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "participant_code": "MM_A1B2C3_1K2L3M",
        "question_id": "starker_akzent",
        "limesurvey_id": "12345",
        "audio_file": "dialect_sample.mp3"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], ...]]
      }
    }
  ]
}
```

#### **CSV für Excel/SPSS**
```csv
participant_code,limesurvey_id,participant_created,question_id,audio_file,response_created,study_name
MM_A1B2C3_1K2L3M,12345,2024-01-15,starker_akzent,,2024-01-15,Französische Dialekte
```

## 🛠️ API-Referenz

### **Studien-Management**
- `GET /api/studies` - Alle Studien auflisten
- `POST /api/studies` - Neue Studie erstellen
- `GET /api/studies/:id` - Studie laden
- `PUT /api/studies/:id` - Studie aktualisieren
- `DELETE /api/studies/:id` - Studie löschen

### **Teilnehmer-Management**
- `POST /api/participants` - Neuen Teilnehmer erstellen
- `GET /api/participants/:id` - Teilnehmer laden

### **Antworten**
- `POST /api/responses` - Antwort speichern
- `GET /api/responses/:participantId` - Antworten eines Teilnehmers

### **Audio-Management**
- `POST /api/upload-audio` - Audio-Datei hochladen
- `GET /api/audio/files` - Audio-Dateien auflisten
- `DELETE /api/audio/:filename` - Audio-Datei löschen

### **Export**
- `GET /api/export/:studyId/geojson` - GeoJSON-Export
- `GET /api/export/:studyId/csv` - CSV-Export
- `GET /api/export/:studyId/summary` - Studien-Zusammenfassung
- `GET /api/export/:studyId/participants` - Teilnehmer-Liste

## 🔧 Konfiguration

### **Umgebungsvariablen**
```bash
# Server-Port (Standard: 3003)
PORT=3003

# Datenbank-Pfad (Standard: ./mentalmap.db)
DB_PATH=./mentalmap.db

# Upload-Verzeichnis (Standard: ./uploads)
UPLOAD_DIR=./uploads
```

### **Studien-Konfiguration**
```javascript
{
  "name": "Studienname",
  "config": {
    "questions": [
      {
        "id": "frage_1",
        "type": "map_drawing",
        "text": "Frage-Text",
        "singlePolygon": false,
        "maxPolygons": 3
      },
      {
        "id": "audio_frage",
        "type": "audio_perception",
        "text": "Audio-Frage",
        "audioFile": "audio.mp3",
        "singlePolygon": true
      }
    ],
    "mapConfig": {
      "center": [46.5, 2.5],
      "zoom": 6,
      "basemap": "openstreetmap"
    }
  }
}
```

## 🐳 Docker-Deployment

### **Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Backend
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Frontend
COPY client/package*.json ./client/
RUN cd client && npm install --production
COPY client/ ./client/
RUN cd client && npm run build

# Root
COPY package*.json ./
RUN npm install --production

COPY server/ ./server/
COPY --from=client/build ./client/build ./client/build

EXPOSE 3003

CMD ["node", "server/index.js"]
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  mentalmap:
    build: .
    ports:
      - "3003:3003"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - PORT=3003
```

## 🔒 Sicherheit

### **Produktions-Einstellungen**
- Ändern Sie Standard-Passwörter
- Verwenden Sie HTTPS in der Produktion
- Konfigurieren Sie CORS für Ihre Domain
- Sichern Sie die Datenbank-Backups

### **Daten-Backup**
```bash
# SQLite-Datenbank sichern
cp mentalmap.db mentalmap_backup_$(date +%Y%m%d).db

# Upload-Verzeichnis sichern
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🐛 Troubleshooting

### **Häufige Probleme**

#### **Port bereits belegt**
```bash
# Port freigeben
netstat -ano | findstr :3003
taskkill /PID <PID> /F
```

#### **Audio-Dateien werden nicht abgespielt**
- Überprüfen Sie Dateiformat (MP3, WAV, OGG)
- Kontrollieren Sie Dateigröße (< 10MB empfohlen)
- Testen Sie Browser-Kompatibilität

#### **Polygone werden nicht gespeichert**
- Überprüfen Sie Backend-Verbindung
- Kontrollieren Sie Browser-Konsole auf Fehler
- Testen Sie mit einfachen Polygonen

#### **Export funktioniert nicht**
- Stellen Sie sicher, dass Antworten vorhanden sind
- Überprüfen Sie Datenbank-Verbindung
- Kontrollieren Sie Dateiberechtigungen

## 🤝 Beitragen

### **Entwicklung**
1. Fork das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie den Branch (`git push origin feature/AmazingFeature`)
5. Erstellen Sie einen Pull Request

### **Bug-Reports**
Bitte verwenden Sie das Issue-Template und fügen Sie hinzu:
- Browser und Version
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
- Screenshots (falls zutreffend)

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## 🏛️ Institutionelle Unterstützung

**Ruhr-Universität Bochum**
- Fakultät für Philologie
- Germanistische Linguistik
- IT.SERVICES für technische Infrastruktur

## 🙏 Credits

- **FLOM** (Folk Linguistic Online Mapping) - Inspiration für Konzept
- **SDATS** (Swiss German Dialects Across Time and Space) - Zeichnungsideen  
- **OpenStreetMap** - Karten-Daten
- **Leaflet** - Karten-Bibliothek
- **React** - Frontend-Framework
- **Node.js** - Backend-Runtime

## 📞 Support & Kontakt

**Technischer Support:**
- GitHub Issues: [Probleme melden](https://github.com/oppenpsy-rub/mental-maps/issues)
- E-Mail: [Kontakt über RUB](mailto:it-services@rub.de)

**Forschungskooperationen:**
- Ruhr-Universität Bochum
- Fakultät für Philologie
- Germanistische Linguistik

---

**Entwickelt mit ❤️ an der Ruhr-Universität Bochum für die linguistische Forschungsgemeinschaft**