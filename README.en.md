# 🗺️ MentalMap-Tool

[![License: Custom](https://img.shields.io/badge/License-Custom-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## 🌍 Languages / Sprachen / Langues

- **🇩🇪 [Deutsch](README.md)**
- **🇺🇸 English** (this file / diese Datei)
- **🇫🇷 [Français](README.fr.md)**

---

A professional, web-based tool for linguistic perception studies with interactive map drawing and audio perception research.

## 🎓 Developed at Ruhr University Bochum

This tool was developed for linguistic research and enables researchers to systematically capture and analyze mental maps.

## ✨ Features

### 🎯 **Main Functions**
- **Interactive map drawing** with freehand polygon drawing
- **Audio perception studies** with audio upload and playback
- **Flexible study configuration** with custom questions
- **Participant code generation** for LimeSurvey integration
- **Data export** for QGIS, Excel, and SPSS

### 🛠️ **Technical Features**
- **React.js frontend** with modern UI
- **Responsive design** with hamburger menu for mobile/tablet/desktop
- **10 languages supported** (German, English, French, Italian, Spanish, Portuguese, Romanian, Chinese, Russian, Catalan)
- **Touch support** for mobile devices in polygon drawing
- **GPS geolocation capture** (optional, for participant locations)
- **Node.js/Express backend** with SQLite database
- **OpenStreetMap integration** (open source)
- **GeoJSON export** for QGIS analysis
- **CSV export** for statistical analyses
- **Audio upload** and management

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd mentalmap-prototype
```

2. **Install dependencies**
```bash
# Root dependencies
npm install

# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

3. **Start application**
```bash
# Back to root directory
cd ..

# Start backend (Terminal 1)
cd server
npm start

# Start frontend (Terminal 2)
cd client
npm start
```

4. **Open application**
- Frontend: http://localhost:3000
- Backend: http://localhost:3003

## 📖 User Manual

### 🎨 **For Participants**

1. **Start survey**
   - Open http://localhost:3000
   - Participant code is automatically generated
   - Note the code for LimeSurvey (or any other survey solution for capturing demographic data and additional attitude questions)

2. **Draw polygons**
   - Click "Start Drawing"
   - Hold down the mouse and draw (also touch gestures on mobile devices)
   - Release the mouse → polygon will be completed if necessary
   - You can draw multiple polygons if allowed for the respective question

3. **GPS location capture** (if enabled)
   - If the study has GPS capture enabled, you will be asked for location access
   - Your approximate location will be captured once when completing the survey
   - This is optional and can be declined

3. **Delete individual polygons**
   - Hover over a polygon (turns red)
   - Click on it to delete
   - If needed, you can also delete all polygons at once

4. **Audio questions**
   - Listen to the audio
   - Read the associated question
   - Draw the polygons

### 🔧 **For Administrators / Researchers**

#### **Manage audio files**
1. Click "🎵 Audio" in the main view
2. Upload MP3, WAV, or OGG files
3. Test audio playback
4. Delete files no longer needed

#### **Create and manage studies**
1. Click "📊 Studies" in the main view
2. Create a new study or edit existing ones
3. Add questions
4. Configure polygon limits (1, 3, 5, 10 polygons)
5. **Optional**: Enable GPS capture in study settings
6. **Optional**: Enable consent screen for participants
7. Save the study
8. Publish the study to give participants access

#### **Export data**
1. Select a study
2. Click "📊 Export Data"
3. Download:
   - **GeoJSON**: For QGIS analysis
   - **CSV**: For Excel/SPSS analysis
4. Copy participant codes for LimeSurvey

## 🗂️ Data Structure

### **Database Schema**
```sql
-- Studies
studies (id, name, config, created_at)

-- Participants
participants (id, code, study_id, limesurvey_id, created_at)

-- Responses
responses (id, participant_id, question_id, geometry, audio_file, created_at)
```

### **Export Formats**

#### **GeoJSON for QGIS**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "participant_code": "MM_A1B2C3_1K2L3M",
        "question_id": "strong_accent",
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

#### **CSV for Excel/SPSS**
```csv
participant_code,limesurvey_id,participant_created,question_id,audio_file,response_created,study_name
MM_A1B2C3_1K2L3M,12345,2024-01-15,strong_accent,,2024-01-15,French Dialects
```

## 🛠️ API Reference

### **Study Management**
- `GET /api/studies` - List all studies
- `POST /api/studies` - Create new study
- `GET /api/studies/:id` - Load study
- `PUT /api/studies/:id` - Update study
- `DELETE /api/studies/:id` - Delete study

### **Participant Management**
- `POST /api/participants` - Create new participant
- `GET /api/participants/:id` - Load participant

### **Responses**
- `POST /api/responses` - Save response
- `GET /api/responses/:participantId` - Responses of a participant

### **Audio Management**
- `POST /api/upload-audio` - Upload audio file
- `GET /api/audio/files` - List audio files
- `DELETE /api/audio/:filename` - Delete audio file

### **Export**
- `GET /api/export/:studyId/geojson` - GeoJSON export
- `GET /api/export/:studyId/csv` - CSV export
- `GET /api/export/:studyId/summary` - Study summary
- `GET /api/export/:studyId/participants` - Participant list

## 🔧 Configuration

### **Environment Variables**
```bash
# Server port (default: 3003)
PORT=3003

# Database path (default: ./mentalmap.db)
DB_PATH=./mentalmap.db

# Upload directory (default: ./uploads)
UPLOAD_DIR=./uploads
```

### **Study Configuration**
```javascript
{
  "name": "Study Name",
  "config": {
    "questions": [
      {
        "id": "question_1",
        "type": "map_drawing",
        "text": "Question text",
        "singlePolygon": false,
        "maxPolygons": 3
      },
      {
        "id": "audio_question",
        "type": "audio_perception",
        "text": "Audio question",
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

## 🐳 Docker Deployment

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

## 🔒 Security

### **Production Settings**
- Change default passwords
- Use HTTPS in production
- Configure CORS for your domain
- Secure database backups

### **Data Backup**
```bash
# Backup SQLite database
cp mentalmap.db mentalmap_backup_$(date +%Y%m%d).db

# Backup upload directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🐛 Troubleshooting

### **Common Issues**

#### **Port already in use**
```bash
# Free port
netstat -ano | findstr :3003
taskkill /PID <PID> /F
```

#### **Audio files not playing**
- Check file format (MP3, WAV, OGG)
- Check file size (< 10MB recommended)
- Test browser compatibility

#### **Polygons not being saved**
- Check backend connection
- Check browser console for errors
- Test with simple polygons

#### **Export not working**
- Ensure responses exist
- Check database connection
- Check file permissions

## 🤝 Contributing

### **Development**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### **Bug Reports**
Please use the issue template and include:
- Browser and version
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)

## 📄 License

**Custom Research License** - see [LICENSE](LICENSE) file for details.

**Important Notice:** This project uses a restrictive license. Any use, modification, or development outside of permitted educational and research purposes requires explicit written permission from the author. Contact us before use!

## 🙏 Credits

- **FLOM & SDATS** - [Folk Linguistic Online Mapping](https://depts.washington.edu/flom/) & [Swiss German Dialects Across Time and Space](https://www.sdats.ch/) - Inspiration for concept and possible functionality of drawing
- **OpenStreetMap** - Map data
- **Leaflet** - Map library
- **React** - Frontend framework
- **Node.js** - Backend runtime

## 📞 Support & Contact

**Technical Support:**
- GitHub Issues: [Report Issues](https://github.com/oppenpsy-rub/mental-maps/issues)
- Email: [Philip Oppenländer](mailto:philip.oppenlaender@rub.de)

---

**Developed with ❤️ at the [Romance Languages Department of Ruhr University Bochum](https://www.romanistik.rub.de) for the linguistic research community**