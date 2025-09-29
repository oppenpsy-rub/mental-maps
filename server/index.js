const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { extractUserLanguage, sendLocalizedResponse, getLocalizedMessage } = require('./localization');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(extractUserLanguage); // Add language extraction middleware

// Configure Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://tile.openstreetmap.org https://server.arcgisonline.com; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "media-src 'self' blob:; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  next();
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Multer für Audio-Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      const message = getLocalizedMessage('error.bad_request', req.userLanguage || 'de');
      cb(new Error(message), false);
    }
  }
});

// MySQL Datenbank Konfiguration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'mentalmap_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  database: process.env.DB_NAME || 'mentalmap',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// MySQL Connection Pool erstellen
const pool = mysql.createPool(dbConfig);

// Datenbank initialisieren
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Datenbank verbunden');
    
    // Tabellen erstellen
    await connection.execute(`CREATE TABLE IF NOT EXISTS studies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      config TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await connection.execute(`CREATE TABLE IF NOT EXISTS participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(255) UNIQUE NOT NULL,
      study_id INT,
      limesurvey_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (study_id) REFERENCES studies (id)
    )`);

    await connection.execute(`CREATE TABLE IF NOT EXISTS responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      participant_id INT,
      question_id VARCHAR(255),
      geometry LONGTEXT,
      audio_file VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants (id)
    )`);
    
    await connection.execute(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      institution VARCHAR(255),
      department VARCHAR(255),
      language VARCHAR(10) DEFAULT 'de',
      approved BOOLEAN DEFAULT FALSE,
      pending BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    
    // Add approved and pending columns to existing users table if they don't exist
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN approved BOOLEAN DEFAULT FALSE`);
    } catch (error) {
      // Column already exists, ignore error
    }
    
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN pending BOOLEAN DEFAULT TRUE`);
    } catch (error) {
      // Column already exists, ignore error
    }
    
    // Add limesurvey_id column to existing participants table if it doesn't exist
    try {
      await connection.execute(`ALTER TABLE participants ADD COLUMN limesurvey_id VARCHAR(255)`);
    } catch (error) {
      // Column already exists, ignore error
    }
    
    connection.release();
    console.log('Datenbank-Tabellen erfolgreich erstellt/überprüft');
  } catch (error) {
    console.error('Fehler bei der Datenbankinitialisierung:', error);
    process.exit(1);
  }
}

// Datenbank beim Start initialisieren
initializeDatabase();

// Teilnehmer-Code Generator
function generateParticipantCode() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MM_${randomBytes}_${timestamp}`;
}

// Auth Middleware
const JWT_SECRET = process.env.JWT_SECRET || 'mental-maps-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return sendLocalizedResponse(res, 401, 'auth.unauthorized', req.userLanguage);
  }
  
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return sendLocalizedResponse(res, 403, 'auth.token_expired', req.userLanguage);
    }
    
    // Get user's language preference from database
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        'SELECT language FROM users WHERE id = ?',
        [user.id]
      );
      connection.release();
      
      if (rows.length > 0) {
        req.userLanguage = rows[0].language || req.userLanguage;
        user.language = rows[0].language;
      }
    } catch (error) {
      console.error('Error fetching user language:', error);
    }
    
    req.user = user;
    next();
  });
}

// API Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return sendLocalizedResponse(res, 400, 'auth.user_already_exists', req.userLanguage);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with pending status
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, approved, pending) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'researcher', false, true]
    );
    
    const userId = result.insertId;
    
    // Log new registration for admin notification
    console.log(`New user registration pending approval: ${name} (${email}) - ID: ${userId}`);
    
    // Return success without JWT token since user needs approval
    return sendLocalizedResponse(res, 201, 'auth.user_registration_pending', req.userLanguage, {
      message: 'Registration successful. Please wait for admin approval.',
      pending: true
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return sendLocalizedResponse(res, 500, 'error.internal_server_error', req.userLanguage);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', {
      body: req.body,
      headers: req.headers,
      contentType: req.get('Content-Type')
    });
    
    const { email, password } = req.body;
    
    console.log('Extracted credentials:', { email, password: password ? '[PRESENT]' : '[MISSING]' });
    
    // Benutzer in Datenbank suchen
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    
    if (!user) {
      return sendLocalizedResponse(res, 400, 'auth.invalid_credentials', req.userLanguage);
    }
    
    // Check if user is approved
    if (!user.approved || user.pending) {
      return sendLocalizedResponse(res, 403, 'auth.account_pending_approval', req.userLanguage);
    }
    
    // Passwort überprüfen
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return sendLocalizedResponse(res, 400, 'auth.invalid_credentials', req.userLanguage);
    }
    
    // JWT Token erstellen
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return sendLocalizedResponse(res, 200, 'auth.login_success', req.userLanguage, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        department: user.department,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    return sendLocalizedResponse(res, 500, 'error.server_error', req.userLanguage);
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, role, institution, department, language FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      department: user.department,
      language: user.language
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerdaten:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Profile endpoints
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, role, institution, department, language FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    
    if (!user) {
      return sendLocalizedResponse(res, 404, 'profile.not_found', req.userLanguage);
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      department: user.department,
      language: user.language
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Profils:', error);
    return sendLocalizedResponse(res, 500, 'error.server_error', req.userLanguage);
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, institution, department, language } = req.body;
    
    // Update user profile
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, institution = ?, department = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, institution, department, language, req.user.id]
    );
    
    // Get updated user data
    const [rows] = await pool.execute('SELECT id, name, email, role, institution, department, language FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    
    return sendLocalizedResponse(res, 200, 'profile.updated_success', req.userLanguage, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        department: user.department,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    return sendLocalizedResponse(res, 500, 'profile.update_error', req.userLanguage);
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Since we're using JWT tokens, logout is handled client-side by removing the token
    // This endpoint confirms the logout action and can be used for logging purposes
    return sendLocalizedResponse(res, 200, 'auth.logout_success', req.userLanguage, {
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return sendLocalizedResponse(res, 500, 'error.server_error', req.userLanguage);
  }
});

// Neue Studie erstellen
app.post('/api/studies', async (req, res) => {
  try {
    const { name, config } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO studies (name, config) VALUES (?, ?)',
      [name, JSON.stringify(config)]
    );
    
    return sendLocalizedResponse(res, 201, 'study.created_success', req.userLanguage, { 
      id: result.insertId, 
      name, 
      config 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Studie:', error);
    return sendLocalizedResponse(res, 500, 'study.creation_error', req.userLanguage);
  }
});

// Studien abrufen (ohne Authentifizierung für Kompatibilität)
app.get('/api/studies', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, config, created_at, status FROM studies ORDER BY created_at DESC');
    
    // Parse config JSON für jede Studie
    const studies = rows.map(row => ({
      ...row,
      config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config
    }));
    
    res.json(studies);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Einzelne Studie abrufen (ohne Authentifizierung für Kompatibilität)
app.get('/api/studies/:id', async (req, res) => {
  try {
    const studyId = req.params.id;
    
    const [rows] = await pool.execute('SELECT * FROM studies WHERE id = ?', [studyId]);
    const row = rows[0];
    
    if (!row) {
      return sendLocalizedResponse(res, 404, 'study.not_found', req.userLanguage);
    }
    
    // Config als JSON parsen
    try {
      row.config = JSON.parse(row.config);
    } catch (e) {
      row.config = {};
    }
    
    res.json(row);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Studie aktualisieren
app.put('/api/studies/:id', async (req, res) => {
  try {
    const studyId = req.params.id;
    const { name, config } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE studies SET name = ?, config = ? WHERE id = ?',
      [name, JSON.stringify(config), studyId]
    );
    
    if (result.affectedRows === 0) {
      return sendLocalizedResponse(res, 404, 'study.not_found', req.userLanguage);
    }
    
    return sendLocalizedResponse(res, 200, 'study.updated_success', req.userLanguage, { 
      id: studyId, 
      name, 
      config 
    });
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'study.update_error', req.userLanguage);
  }
});

// Studie löschen
app.delete('/api/studies/:id', async (req, res) => {
  try {
    const studyId = req.params.id;
    
    const [result] = await pool.execute('DELETE FROM studies WHERE id = ?', [studyId]);
    
    if (result.affectedRows === 0) {
      return sendLocalizedResponse(res, 404, 'study.not_found', req.userLanguage);
    }
    
    return sendLocalizedResponse(res, 200, 'study.deleted_success', req.userLanguage);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'study.deletion_error', req.userLanguage);
  }
});

// Studie veröffentlichen
app.post('/api/studies/:id/publish', async (req, res) => {
  try {
    const studyId = req.params.id;
    
    const [result] = await pool.execute('UPDATE studies SET status = ? WHERE id = ?', ['published', studyId]);
    
    if (result.affectedRows === 0) {
      return sendLocalizedResponse(res, 404, 'study.not_found', req.userLanguage);
    }
    
    return sendLocalizedResponse(res, 200, 'study.published_success', req.userLanguage, {
      publicUrl: `${req.protocol}://${req.get('host')}/survey/${studyId}`
    });
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'study.publish_error', req.userLanguage);
  }
});

// Studie zurückziehen
app.post('/api/studies/:id/unpublish', async (req, res) => {
  try {
    const studyId = req.params.id;
    
    const [result] = await pool.execute('UPDATE studies SET status = ? WHERE id = ?', ['draft', studyId]);
    
    if (result.affectedRows === 0) {
      return sendLocalizedResponse(res, 404, 'study.not_found', req.userLanguage);
    }
    
    return sendLocalizedResponse(res, 200, 'study.unpublished_success', req.userLanguage);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'study.unpublish_error', req.userLanguage);
  }
});

// Neuen Teilnehmer erstellen
app.post('/api/participants', async (req, res) => {
  try {
    const { studyId } = req.body;
    const code = generateParticipantCode();
    
    const [result] = await pool.execute(
      'INSERT INTO participants (code, study_id) VALUES (?, ?)',
      [code, studyId]
    );
    
    return sendLocalizedResponse(res, 201, 'study.participant_created_success', req.userLanguage, { 
      id: result.insertId, 
      code, 
      studyId 
    });
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'study.participant_creation_error', req.userLanguage);
  }
});

// Audio-Upload
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return sendLocalizedResponse(res, 400, 'error.no_audio_file', req.userLanguage);
  }
  
  return sendLocalizedResponse(res, 200, 'general.audio_uploaded_success', req.userLanguage, {
    filename: req.file.filename,
    path: `/uploads/audio/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

// Get all audio files
app.get('/api/audio/files', (req, res) => {
  const audioDir = './uploads/audio/';
  fs.readdir(audioDir, (err, files) => {
    if (err) {
      return sendLocalizedResponse(res, 500, 'error.audio_directory_read', req.userLanguage);
    }
    const audioFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg')
    );
    res.json({ files: audioFiles });
  });
});

// Delete audio file
app.delete('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = `./uploads/audio/${filename}`;
  
  fs.unlink(filePath, (err) => {
    if (err) {
      return sendLocalizedResponse(res, 500, 'error.file_deletion', req.userLanguage);
    }
    return sendLocalizedResponse(res, 200, 'general.file_deleted_success', req.userLanguage);
  });
});

// Antwort speichern
app.post('/api/responses', async (req, res) => {
  try {
    console.log('📝 Empfangene Daten:', {
      participantId: req.body.participantId,
      questionId: req.body.questionId,
      geometryType: typeof req.body.geometry,
      geometryKeys: req.body.geometry ? Object.keys(req.body.geometry) : 'null',
      audioFile: req.body.audioFile
    });
    
    const { participantId, questionId, geometry, audioFile } = req.body;
    
    // Validierung der erforderlichen Felder
    if (!participantId || !questionId) {
      console.error('❌ Fehlende erforderliche Felder:', { participantId, questionId });
      return sendLocalizedResponse(res, 400, 'error.missing_required_fields', req.userLanguage);
    }
    
    // Teilnehmer-Code in Datenbank-ID umwandeln
    let participantDbId;
    try {
      const [participantRows] = await pool.execute(
        'SELECT id FROM participants WHERE code = ?',
        [participantId]
      );
      
      if (participantRows.length === 0) {
        console.error('❌ Teilnehmer nicht gefunden:', participantId);
        return sendLocalizedResponse(res, 404, 'study.participant_not_found', req.userLanguage);
      }
      
      participantDbId = participantRows[0].id;
      console.log('✅ Teilnehmer-Code zu ID konvertiert:', { code: participantId, id: participantDbId });
    } catch (lookupError) {
      console.error('❌ Fehler beim Suchen des Teilnehmers:', lookupError);
      return sendLocalizedResponse(res, 500, 'study.participant_lookup_error', req.userLanguage);
    }
    
    // Geometry-Daten validieren und stringifizieren
    let geometryString = null;
    try {
      geometryString = geometry ? JSON.stringify(geometry) : null;
      console.log('✅ Geometry erfolgreich stringifiziert, Länge:', geometryString ? geometryString.length : 0);
    } catch (stringifyError) {
      console.error('❌ Fehler beim Stringifizieren der Geometry:', stringifyError);
      return sendLocalizedResponse(res, 400, 'error.invalid_geometry_data', req.userLanguage);
    }
    
    // AudioFile Parameter sicherstellen (null statt undefined)
    const audioFileParam = audioFile || null;
    
    console.log('💾 Speichere in Datenbank mit Parametern:', {
      participantDbId,
      questionId,
      geometryString: geometryString ? 'vorhanden' : 'null',
      audioFileParam: audioFileParam ? 'vorhanden' : 'null'
    });
    
    const [result] = await pool.execute(
      'INSERT INTO responses (participant_id, question_id, geometry, audio_file) VALUES (?, ?, ?, ?)',
      [participantDbId, questionId, geometryString, audioFileParam]
    );
    
    console.log('✅ Erfolgreich gespeichert mit ID:', result.insertId);
    return sendLocalizedResponse(res, 201, 'study.response_saved_success', req.userLanguage, { 
      id: result.insertId 
    });
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Antwort:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    return sendLocalizedResponse(res, 500, 'study.response_save_error', req.userLanguage);
  }
});

// Antworten eines Teilnehmers laden
app.get('/api/responses/:participantId', async (req, res) => {
  try {
    const participantId = req.params.participantId;
    
    const [rows] = await pool.execute(
      'SELECT * FROM responses WHERE participant_id = ?',
      [participantId]
    );
    
    const responses = rows.map(row => ({
      ...row,
      geometry: JSON.parse(row.geometry)
    }));
    
    res.json(responses);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Export für QGIS (GeoJSON)
app.get('/api/export/:studyId/geojson', async (req, res) => {
  try {
    const studyId = req.params.studyId;
    
    const [rows] = await pool.execute(`
      SELECT 
        r.geometry,
        r.question_id,
        r.audio_file,
        r.created_at,
        p.code as participant_code
      FROM responses r
      JOIN participants p ON r.participant_id = p.id
      WHERE p.study_id = ?
    `, [studyId]);
    
    const features = [];
    
    rows.forEach((row, index) => {
      const storedGeometry = JSON.parse(row.geometry);
      
      // Extract polygons from the nested structure
      if (storedGeometry.type === "FeatureCollection" && storedGeometry.features) {
        storedGeometry.features.forEach((feature, featureIndex) => {
          let polygonGeometry = null;
          
          // Handle different nesting levels
          if (feature.geometry && feature.geometry.geometry && feature.geometry.geometry.type === "Polygon") {
            // Double nested structure
            polygonGeometry = feature.geometry.geometry;
          } else if (feature.geometry && feature.geometry.type === "Polygon") {
            // Single nested structure
            polygonGeometry = feature.geometry;
          }
          
          if (polygonGeometry) {
            features.push({
              type: "Feature",
              properties: {
                id: `${index + 1}_${featureIndex + 1}`,
                question_id: row.question_id,
                participant_code: row.participant_code,
                audio_file: row.audio_file,
                created_at: row.created_at
              },
              geometry: polygonGeometry
            });
          }
        });
      }
    });
    
    const geojson = {
      type: "FeatureCollection",
      features: features
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="study_${studyId}_export.geojson"`);
    res.json(geojson);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.export_error', req.userLanguage);
  }
});

// GeoJSON Export für einzelne Teilnehmer
app.get('/api/export/:studyId/participant/:participantCode/geojson', async (req, res) => {
  try {
    const { studyId, participantCode } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT 
        r.geometry,
        r.question_id,
        r.audio_file,
        r.created_at,
        p.code as participant_code
      FROM responses r
      JOIN participants p ON r.participant_id = p.id
      WHERE p.study_id = ? AND p.code = ?
    `, [studyId, participantCode]);
    
    const features = [];
    
    rows.forEach((row, index) => {
      const storedGeometry = JSON.parse(row.geometry);
      
      // Extract polygons from the nested structure
      if (storedGeometry.type === "FeatureCollection" && storedGeometry.features) {
        storedGeometry.features.forEach((feature, featureIndex) => {
          let polygonGeometry = null;
          
          // Handle different nesting levels
          if (feature.geometry && feature.geometry.geometry && feature.geometry.geometry.type === "Polygon") {
            // Double nested structure
            polygonGeometry = feature.geometry.geometry;
          } else if (feature.geometry && feature.geometry.type === "Polygon") {
            // Single nested structure
            polygonGeometry = feature.geometry;
          }
          
          if (polygonGeometry) {
            features.push({
              type: "Feature",
              properties: {
                id: `${index + 1}_${featureIndex + 1}`,
                question_id: row.question_id,
                participant_code: row.participant_code,
                audio_file: row.audio_file,
                created_at: row.created_at
              },
              geometry: polygonGeometry
            });
          }
        });
      }
    });
    
    const geojson = {
      type: "FeatureCollection",
      features: features
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="study_${studyId}_participant_${participantCode}_export.geojson"`);
    res.json(geojson);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.export_error', req.userLanguage);
  }
});

// CSV Export für Studien
app.get('/api/export/:studyId/csv', async (req, res) => {
  try {
    const studyId = req.params.studyId;
    
    const [rows] = await pool.execute(`
      SELECT 
        p.code as participant_code,
        p.created_at as participant_created,
        r.question_id,
        r.audio_file,
        r.created_at as response_created,
        s.name as study_name
      FROM responses r 
      JOIN participants p ON r.participant_id = p.id 
      JOIN studies s ON p.study_id = s.id
      WHERE p.study_id = ?
      ORDER BY p.created_at, r.created_at
    `, [studyId]);
    
    // CSV Header
    const csvHeader = [
      'participant_code',
      'participant_created',
      'question_id',
      'audio_file',
      'response_created',
      'study_name'
    ].join(',');
    
    // CSV Rows
    const csvRows = rows.map(row => [
      row.participant_code,
      row.participant_created,
      row.question_id,
      row.audio_file || '',
      row.response_created,
      row.study_name
    ].map(field => `"${field}"`).join(','));
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="study_${studyId}_export.csv"`);
    res.send('\ufeff' + csvContent); // BOM für Excel-Kompatibilität
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.export_error', req.userLanguage);
  }
});

// Zusammenfassung einer Studie
app.get('/api/export/:studyId/summary', async (req, res) => {
  try {
    const studyId = req.params.studyId;
    
    // Studie laden
    const [studyRows] = await pool.execute('SELECT * FROM studies WHERE id = ?', [studyId]);
    const study = studyRows[0];
    
    if (!study) {
      return sendLocalizedResponse(res, 404, 'study.not_found', req.userLanguage);
    }
    
    // Statistiken sammeln
    const [statsRows] = await pool.execute(
      `SELECT 
         COUNT(DISTINCT p.id) as participant_count,
         COUNT(r.id) as response_count,
         COUNT(DISTINCT r.question_id) as questions_answered
       FROM participants p 
       LEFT JOIN responses r ON p.id = r.participant_id
       WHERE p.study_id = ?`,
      [studyId]
    );
    
    const studyConfig = JSON.parse(study.config);
    const summary = {
      study: {
        id: study.id,
        name: study.name,
        created_at: study.created_at,
        questions: studyConfig.questions.length
      },
      statistics: {
        participants: statsRows[0].participant_count,
        responses: statsRows[0].response_count,
        questions_answered: statsRows[0].questions_answered
      },
      questions: studyConfig.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        audioFile: q.audioFile || null
      }))
    };
    
    res.json(summary);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Alle Teilnehmer einer Studie
app.get('/api/export/:studyId/participants', async (req, res) => {
  try {
    const studyId = req.params.studyId;
    
    const [rows] = await pool.execute(
      `SELECT 
         p.id,
         p.code,
         p.limesurvey_id,
         p.created_at,
         COUNT(r.id) as response_count
       FROM participants p 
       LEFT JOIN responses r ON p.id = r.participant_id
       WHERE p.study_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [studyId]
    );
    
    res.json(rows);
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Einzelnen Teilnehmer und dessen Antworten löschen
app.delete('/api/export/:studyId/participants/:participantId', async (req, res) => {
  try {
    const studyId = req.params.studyId;
    const participantId = req.params.participantId;
    
    // Prüfen, ob der Teilnehmer zur angegebenen Studie gehört
    const [participantRows] = await pool.execute(
      'SELECT id, code FROM participants WHERE id = ? AND study_id = ?',
      [participantId, studyId]
    );
    
    if (participantRows.length === 0) {
      return sendLocalizedResponse(res, 404, 'participant.not_found', req.userLanguage);
    }
    
    const participant = participantRows[0];
    
    // Zuerst alle Antworten des Teilnehmers löschen
    const [deleteResponsesResult] = await pool.execute(
      'DELETE FROM responses WHERE participant_id = ?',
      [participantId]
    );
    
    // Dann den Teilnehmer selbst löschen
    const [deleteParticipantResult] = await pool.execute(
      'DELETE FROM participants WHERE id = ?',
      [participantId]
    );
    
    console.log(`✅ Teilnehmer ${participant.code} gelöscht: ${deleteResponsesResult.affectedRows} Antworten, 1 Teilnehmer`);
    
    res.json({
      success: true,
      message: `Teilnehmer ${participant.code} und ${deleteResponsesResult.affectedRows} Antworten wurden erfolgreich gelöscht`,
      deletedResponses: deleteResponsesResult.affectedRows,
      participantCode: participant.code
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Teilnehmers:', error);
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// LimeSurvey ID für einen Teilnehmer aktualisieren
app.put('/api/export/:studyId/participants/:participantId/limesurvey', async (req, res) => {
  try {
    const studyId = req.params.studyId;
    const participantId = req.params.participantId;
    const { limesurvey_id } = req.body;
    
    // Prüfen, ob der Teilnehmer zur angegebenen Studie gehört
    const [participantRows] = await pool.execute(
      'SELECT id, code FROM participants WHERE id = ? AND study_id = ?',
      [participantId, studyId]
    );
    
    if (participantRows.length === 0) {
      return sendLocalizedResponse(res, 404, 'participant.not_found', req.userLanguage);
    }
    
    const participant = participantRows[0];
    
    // LimeSurvey ID aktualisieren
    const [updateResult] = await pool.execute(
      'UPDATE participants SET limesurvey_id = ? WHERE id = ?',
      [limesurvey_id || null, participantId]
    );
    
    console.log(`✅ LimeSurvey ID für Teilnehmer ${participant.code} aktualisiert: ${limesurvey_id || 'null'}`);
    
    res.json({
      success: true,
      message: `LimeSurvey ID für Teilnehmer ${participant.code} wurde erfolgreich aktualisiert`,
      participantCode: participant.code,
      limesurvey_id: limesurvey_id || null
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der LimeSurvey ID:', error);
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Öffentliche Studie abrufen (für PublicSurvey)
app.get('/api/studies/:id/public', async (req, res) => {
  try {
    const studyId = req.params.id;
    
    const [rows] = await pool.execute('SELECT * FROM studies WHERE id = ? AND status = "published"', [studyId]);
    const row = rows[0];
    
    if (!row) {
      return sendLocalizedResponse(res, 404, 'study.not_found_or_not_published', req.userLanguage);
    }
    
    // Config als JSON parsen
    try {
      row.config = JSON.parse(row.config);
    } catch (e) {
      row.config = {};
    }
    
    // Prüfe, ob Zugangsschlüssel erforderlich ist
    const requiresAccessCode = row.config.accessCode && row.config.accessCode.trim() !== '';
    
    res.json({
      ...row,
      requiresAccessCode: requiresAccessCode
    });
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Zugangsschlüssel verifizieren
app.post('/api/studies/:id/verify-access', async (req, res) => {
  try {
    const studyId = req.params.id;
    const { accessCode } = req.body;
    
    const [rows] = await pool.execute('SELECT config FROM studies WHERE id = ? AND status = "published"', [studyId]);
    const row = rows[0];
    
    if (!row) {
      return sendLocalizedResponse(res, 404, 'study.not_found', req.userLanguage);
    }
    
    let config;
    try {
      config = JSON.parse(row.config);
    } catch (e) {
      config = {};
    }
    
    const requiredAccessCode = config.accessCode || '';
    const isValid = requiredAccessCode === '' || requiredAccessCode === accessCode;
    
    res.json({ valid: isValid });
  } catch (error) {
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Admin Routes for User Management
// Get pending users (requires authentication)
app.get('/api/admin/pending-users', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin privileges (you might want to add an admin role)
    if (req.user.role !== 'admin' && req.user.role !== 'researcher') {
      return sendLocalizedResponse(res, 403, 'auth.insufficient_permissions', req.userLanguage);
    }
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, institution, department, created_at FROM users WHERE pending = TRUE AND approved = FALSE ORDER BY created_at DESC'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Approve user
app.post('/api/admin/approve-user/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'researcher') {
      return sendLocalizedResponse(res, 403, 'auth.insufficient_permissions', req.userLanguage);
    }
    
    const userId = req.params.id;
    
    const [result] = await pool.execute(
      'UPDATE users SET approved = TRUE, pending = FALSE WHERE id = ?',
      [userId]
    );
    
    if (result.affectedRows === 0) {
      return sendLocalizedResponse(res, 404, 'user.not_found', req.userLanguage);
    }
    
    // Get user details for logging
    const [userRows] = await pool.execute('SELECT name, email FROM users WHERE id = ?', [userId]);
    const user = userRows[0];
    
    if (user) {
      console.log(`User approved: ${user.name} (${user.email}) - ID: ${userId}`);
    }
    
    return sendLocalizedResponse(res, 200, 'admin.user_approved_successfully', req.userLanguage);
  } catch (error) {
    console.error('Error approving user:', error);
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Reject user
app.post('/api/admin/reject-user/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'researcher') {
      return sendLocalizedResponse(res, 403, 'auth.insufficient_permissions', req.userLanguage);
    }
    
    const userId = req.params.id;
    
    // Get user details for logging before deletion
    const [userRows] = await pool.execute('SELECT name, email FROM users WHERE id = ?', [userId]);
    const user = userRows[0];
    
    const [result] = await pool.execute('DELETE FROM users WHERE id = ? AND pending = TRUE', [userId]);
    
    if (result.affectedRows === 0) {
      return sendLocalizedResponse(res, 404, 'user.not_found_or_already_processed', req.userLanguage);
    }
    
    if (user) {
      console.log(`User registration rejected and deleted: ${user.name} (${user.email}) - ID: ${userId}`);
    }
    
    return sendLocalizedResponse(res, 200, 'admin.user_rejected_successfully', req.userLanguage);
  } catch (error) {
    console.error('Error rejecting user:', error);
    return sendLocalizedResponse(res, 500, 'error.database_error', req.userLanguage);
  }
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Mental Map Server läuft auf Port ${PORT}`);
  console.log(`📊 MySQL Datenbank: ${dbConfig.database}`);
  console.log(`🎵 Audio-Uploads: ./uploads/audio/`);
});
