# 🗺️ MentalMap-Tool

[![License: Custom](https://img.shields.io/badge/License-Custom-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## 🌍 Langues / Languages / Sprachen

- **🇩🇪 [Deutsch](README.md)**
- **🇺🇸 [English](README.en.md)**
- **🇫🇷 Français** (ce fichier / this file)

---

Un outil professionnel basé sur le web pour les études de perception linguistique avec dessin de cartes interactives et recherche sur la perception audio.

## 🎓 Développé à l'Université de la Ruhr Bochum

Cet outil a été développé pour la recherche en linguistique et permet aux chercheurs de capturer et d'analyser systématiquement les cartes mentales.

## ✨ Fonctionnalités

### 🎯 **Fonctions principales**
- **Dessin de cartes interactives** avec dessin de polygones à main levée
- **Études de perception audio** avec téléchargement et lecture audio
- **Configuration d'étude flexible** avec questions personnalisées
- **Génération de codes participants** pour l'intégration LimeSurvey
- **Export de données** pour QGIS, Excel et SPSS

### 🛠️ **Fonctionnalités techniques**
- **Frontend React.js** avec interface utilisateur moderne
- **Backend Node.js/Express** avec base de données SQLite
- **Intégration OpenStreetMap** (open source)
- **Export GeoJSON** pour l'analyse QGIS
- **Export CSV** pour les analyses statistiques
- **Téléchargement et gestion audio**

## 🚀 Démarrage rapide

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Installation

1. **Cloner le dépôt**
```bash
git clone <repository-url>
cd mentalmap-prototype
```

2. **Installer les dépendances**
```bash
# Dépendances racine
npm install

# Dépendances backend
cd server
npm install

# Dépendances frontend
cd ../client
npm install
```

3. **Démarrer l'application**
```bash
# Retour au répertoire racine
cd ..

# Démarrer le backend (Terminal 1)
cd server
npm start

# Démarrer le frontend (Terminal 2)
cd client
npm start
```

4. **Ouvrir l'application**
- Frontend : http://localhost:3000
- Backend : http://localhost:3003

## 📖 Manuel utilisateur

### 🎨 **Pour les participants**

1. **Commencer l'enquête**
   - Ouvrir http://localhost:3000
   - Le code participant est généré automatiquement
   - Noter le code pour LimeSurvey (ou toute autre solution d'enquête pour capturer les données démographiques et les questions d'attitude supplémentaires)

2. **Dessiner des polygones**
   - Cliquer sur "Commencer le dessin"
   - Maintenir la souris enfoncée et dessiner
   - Relâcher la souris → le polygone sera complété si nécessaire
   - Vous pouvez dessiner plusieurs polygones si autorisé pour la question respective

3. **Supprimer des polygones individuels**
   - Survoler un polygone (devient rouge)
   - Cliquer dessus pour le supprimer
   - Si nécessaire, vous pouvez aussi supprimer tous les polygones en une fois

4. **Questions audio**
   - Écouter l'audio
   - Lire la question associée
   - Dessiner les polygones

### 🔧 **Pour les administrateurs / chercheurs**

#### **Gérer les fichiers audio**
1. Cliquer sur "🎵 Audio" dans la vue principale
2. Télécharger des fichiers MP3, WAV ou OGG
3. Tester la lecture audio
4. Supprimer les fichiers qui ne sont plus nécessaires

#### **Créer et gérer les études**
1. Cliquer sur "📊 Études" dans la vue principale
2. Créer une nouvelle étude ou modifier les existantes
3. Ajouter des questions
4. Configurer les limites de polygones (1, 3, 5, 10 polygones)
5. Sauvegarder l'étude
6. Publier l'étude pour donner accès aux participants

#### **Exporter les données**
1. Sélectionner une étude
2. Cliquer sur "📊 Exporter les données"
3. Télécharger :
   - **GeoJSON** : Pour l'analyse QGIS
   - **CSV** : Pour l'analyse Excel/SPSS
4. Copier les codes participants pour LimeSurvey

## 🗂️ Structure des données

### **Schéma de base de données**
```sql
-- Études
studies (id, name, config, created_at)

-- Participants
participants (id, code, study_id, limesurvey_id, created_at)

-- Réponses
responses (id, participant_id, question_id, geometry, audio_file, created_at)
```

### **Formats d'export**

#### **GeoJSON pour QGIS**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "participant_code": "MM_A1B2C3_1K2L3M",
        "question_id": "accent_fort",
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

#### **CSV pour Excel/SPSS**
```csv
participant_code,limesurvey_id,participant_created,question_id,audio_file,response_created,study_name
MM_A1B2C3_1K2L3M,12345,2024-01-15,accent_fort,,2024-01-15,Dialectes français
```

## 🛠️ Référence API

### **Gestion des études**
- `GET /api/studies` - Lister toutes les études
- `POST /api/studies` - Créer une nouvelle étude
- `GET /api/studies/:id` - Charger une étude
- `PUT /api/studies/:id` - Mettre à jour une étude
- `DELETE /api/studies/:id` - Supprimer une étude

### **Gestion des participants**
- `POST /api/participants` - Créer un nouveau participant
- `GET /api/participants/:id` - Charger un participant

### **Réponses**
- `POST /api/responses` - Sauvegarder une réponse
- `GET /api/responses/:participantId` - Réponses d'un participant

### **Gestion audio**
- `POST /api/upload-audio` - Télécharger un fichier audio
- `GET /api/audio/files` - Lister les fichiers audio
- `DELETE /api/audio/:filename` - Supprimer un fichier audio

### **Export**
- `GET /api/export/:studyId/geojson` - Export GeoJSON
- `GET /api/export/:studyId/csv` - Export CSV
- `GET /api/export/:studyId/summary` - Résumé de l'étude
- `GET /api/export/:studyId/participants` - Liste des participants

## 🔧 Configuration

### **Variables d'environnement**
```bash
# Port du serveur (défaut : 3003)
PORT=3003

# Chemin de la base de données (défaut : ./mentalmap.db)
DB_PATH=./mentalmap.db

# Répertoire de téléchargement (défaut : ./uploads)
UPLOAD_DIR=./uploads
```

### **Configuration d'étude**
```javascript
{
  "name": "Nom de l'étude",
  "config": {
    "questions": [
      {
        "id": "question_1",
        "type": "map_drawing",
        "text": "Texte de la question",
        "singlePolygon": false,
        "maxPolygons": 3
      },
      {
        "id": "question_audio",
        "type": "audio_perception",
        "text": "Question audio",
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

## 🐳 Déploiement Docker

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

# Racine
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

## 🔒 Sécurité

### **Paramètres de production**
- Changer les mots de passe par défaut
- Utiliser HTTPS en production
- Configurer CORS pour votre domaine
- Sécuriser les sauvegardes de base de données

### **Sauvegarde des données**
```bash
# Sauvegarder la base de données SQLite
cp mentalmap.db mentalmap_backup_$(date +%Y%m%d).db

# Sauvegarder le répertoire de téléchargement
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🐛 Dépannage

### **Problèmes courants**

#### **Port déjà utilisé**
```bash
# Libérer le port
netstat -ano | findstr :3003
taskkill /PID <PID> /F
```

#### **Les fichiers audio ne se lisent pas**
- Vérifier le format de fichier (MP3, WAV, OGG)
- Vérifier la taille du fichier (< 10MB recommandé)
- Tester la compatibilité du navigateur

#### **Les polygones ne sont pas sauvegardés**
- Vérifier la connexion backend
- Vérifier la console du navigateur pour les erreurs
- Tester avec des polygones simples

#### **L'export ne fonctionne pas**
- S'assurer que les réponses existent
- Vérifier la connexion à la base de données
- Vérifier les permissions de fichiers

## 🤝 Contribuer

### **Développement**
1. Forker le dépôt
2. Créer une branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committer vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser la branche (`git push origin feature/AmazingFeature`)
5. Créer une Pull Request

### **Rapports de bugs**
Veuillez utiliser le modèle d'issue et inclure :
- Navigateur et version
- Étapes pour reproduire
- Comportement attendu vs. réel
- Captures d'écran (si applicable)

## 📄 Licence

**Licence de recherche personnalisée** - voir le fichier [LICENSE](LICENSE) pour les détails.

**Avis important :** Ce projet utilise une licence restrictive. Toute utilisation, modification ou développement en dehors des fins éducatives et de recherche autorisées nécessite une autorisation écrite explicite de l'auteur. Contactez-nous avant utilisation !

## 🙏 Crédits

- **FLOM & SDATS** - [Folk Linguistic Online Mapping](https://depts.washington.edu/flom/) & [Swiss German Dialects Across Time and Space](https://www.sdats.ch/) - Inspiration pour le concept et la fonctionnalité possible du dessin
- **OpenStreetMap** - Données cartographiques
- **Leaflet** - Bibliothèque de cartes
- **React** - Framework frontend
- **Node.js** - Runtime backend

## 📞 Support et contact

**Support technique :**
- GitHub Issues : [Signaler des problèmes](https://github.com/oppenpsy-rub/mental-maps/issues)
- Email : [Philip Oppenländer](mailto:philip.oppenlaender@rub.de)

---

**Développé avec ❤️ au [Département des langues romanes de l'Université de la Ruhr Bochum](https://www.romanistik.rub.de) pour la communauté de recherche linguistique**