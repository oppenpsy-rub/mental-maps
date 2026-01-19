const path = require('path');
// Lade Produktions-Umgebungsvariablen
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

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

// Produktions-spezifische Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-domain.rub.de',
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use(extractUserLanguage);

// Trust proxy für HTTPS (wichtig für RUB-Server hinter Reverse Proxy)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Produktions-optimierte Security Headers
app.use((req, res, next) => {
  // HTTPS erzwingen in Produktion
  if (process.env.FORCE_HTTPS === 'true' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  
  // Erweiterte Security Headers für Produktion
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
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Produktions-optimierte Multer-Konfiguration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.UPLOAD_DIR || './uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_AUDIO_TYPES || 'mp3,wav,ogg').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Audio-Dateien sind erlaubt'), false);
    }
  }
});

// Produktions-optimierte MySQL Datenbank Konfiguration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mentalmap',
  waitForConnections: true,
  connectionLimit: 20, // Erhöht für Produktion
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  // SSL-Konfiguration falls erforderlich
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Validierung der kritischen Umgebungsvariablen
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('FEHLER: Kritische Datenbankverbindungsparameter fehlen!');
  console.error('Bitte überprüfen Sie DB_HOST, DB_USER und DB_PASSWORD in .env.production');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'CHANGE_THIS_TO_STRONG_JWT_SECRET_FOR_PRODUCTION') {
  console.error('FEHLER: JWT_SECRET muss für Produktion gesetzt werden!');
  process.exit(1);
}

// MySQL Connection Pool erstellen
const pool = mysql.createPool(dbConfig);

// JWT Secret aus Umgebungsvariablen
const JWT_SECRET = process.env.JWT_SECRET;

// Produktions-Logging
const logLevel = process.env.LOG_LEVEL || 'warn';
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

if (logLevel === 'warn' || logLevel === 'error') {
  console.log = () => {}; // Unterdrücke normale Logs in Produktion
}

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsoleError(`[${timestamp}] ERROR:`, ...args);
  
  // Optional: Log in Datei schreiben
  if (process.env.LOG_FILE) {
    const logMessage = `[${timestamp}] ERROR: ${args.join(' ')}\n`;
    fs.appendFileSync(process.env.LOG_FILE, logMessage);
  }
};

// Authentifizierungs-Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendLocalizedResponse(res, 401, 'auth.token_required', req.language);
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return sendLocalizedResponse(res, 403, 'auth.token_expired', req.language);
    }
    
    try {
      // Benutzer aus Datenbank laden für aktuelle Informationen
      const [rows] = await pool.execute(
        'SELECT id, name, email, role, approved, pending FROM users WHERE id = ?',
        [user.id]
      );
      
      if (rows.length === 0) {
        return sendLocalizedResponse(res, 403, 'auth.user_not_found', req.language);
      }
      
      const dbUser = rows[0];
      if (!dbUser.approved || dbUser.pending) {
        return sendLocalizedResponse(res, 403, 'auth.user_not_approved', req.language);
      }
      
      req.user = dbUser;
      next();
    } catch (error) {
      console.error('Fehler bei Benutzer-Authentifizierung:', error);
      return sendLocalizedResponse(res, 500, 'auth.server_error', req.language);
    }
  });
}

// Database initialization function
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'researcher') DEFAULT 'researcher',
        institution VARCHAR(255),
        department VARCHAR(255),
        language VARCHAR(10) DEFAULT 'de',
        approved BOOLEAN DEFAULT FALSE,
        pending BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create studies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS studies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        instructions TEXT,
        published BOOLEAN DEFAULT FALSE,
        access_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create participants table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        study_id INT,
        participant_code VARCHAR(100) UNIQUE NOT NULL,
        limesurvey_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE CASCADE
      )
    `);
    
    // Create responses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        participant_id INT,
        study_id INT,
        response_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
        FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE CASCADE
      )
    `);
    
    connection.release();
    console.log('Datenbank-Tabellen erfolgreich erstellt/überprüft');
  } catch (error) {
    console.error('Fehler bei der Datenbankinitialisierung:', error);
    process.exit(1);
  }
}

// Database initialization - DISABLED for production (no admin rights)
// initializeDatabase();
console.log('INFO: Datenbank-Initialisierung übersprungen (keine Admin-Rechte)');

// Participant code generator
function generateParticipantCode() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MM_${randomBytes}_${timestamp}`;
}

// API Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return sendLocalizedResponse(res, 400, 'auth.user_already_exists', req.language);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, approved, pending) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'researcher', false, true]
    );
    
    const userId = result.insertId;
    console.log(`New user registration pending approval: ${name} (${email}) - ID: ${userId}`);
    
    return sendLocalizedResponse(res, 201, 'auth.user_registration_pending', req.language, {
      message: 'Registration successful. Please wait for admin approval.',
      pending: true
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return sendLocalizedResponse(res, 500, 'error.internal_server_error', req.language);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    
    if (!user) {
      return sendLocalizedResponse(res, 400, 'auth.invalid_credentials', req.language);
    }
    
    if (!user.approved || user.pending) {
      return sendLocalizedResponse(res, 403, 'auth.account_pending_approval', req.language);
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return sendLocalizedResponse(res, 400, 'auth.invalid_credentials', req.language);
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return sendLocalizedResponse(res, 200, 'auth.login_success', req.language, {
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
    return sendLocalizedResponse(res, 500, 'error.server_error', req.language);
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

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, role, institution, department, language FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    
    if (!user) {
      return sendLocalizedResponse(res, 404, 'profile.not_found', req.language);
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
    return sendLocalizedResponse(res, 500, 'error.server_error', req.language);
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, institution, department, language } = req.body;
    
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, institution = ?, department = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, institution, department, language, req.user.id]
    );
    
    const [rows] = await pool.execute('SELECT id, name, email, role, institution, department, language FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    
    return sendLocalizedResponse(res, 200, 'profile.updated_success', req.language, {
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
    return sendLocalizedResponse(res, 500, 'profile.update_error', req.language);
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    return sendLocalizedResponse(res, 200, 'auth.logout_success', req.language, {
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return sendLocalizedResponse(res, 500, 'error.server_error', req.language);
  }
});

// Studies Routes
app.post('/api/studies', async (req, res) => {
  try {
    const { title, description, instructions } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO studies (title, description, instructions) VALUES (?, ?, ?)',
      [title, description, instructions]
    );
    res.json({ id: result.insertId, title, description, instructions, published: false });
  } catch (error) {
    console.error('Fehler beim Erstellen der Studie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.get('/api/studies', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM studies ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Studien:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.get('/api/studies/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM studies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Studie nicht gefunden' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Studie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.put('/api/studies/:id', async (req, res) => {
  try {
    const { title, description, instructions } = req.body;
    await pool.execute(
      'UPDATE studies SET title = ?, description = ?, instructions = ? WHERE id = ?',
      [title, description, instructions, req.params.id]
    );
    res.json({ message: 'Studie erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Studie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.delete('/api/studies/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM studies WHERE id = ?', [req.params.id]);
    res.json({ message: 'Studie erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Studie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.post('/api/studies/:id/publish', async (req, res) => {
  try {
    const accessCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await pool.execute(
      'UPDATE studies SET published = TRUE, access_code = ? WHERE id = ?',
      [accessCode, req.params.id]
    );
    res.json({ message: 'Studie erfolgreich veröffentlicht', accessCode });
  } catch (error) {
    console.error('Fehler beim Veröffentlichen der Studie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.post('/api/studies/:id/unpublish', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE studies SET published = FALSE, access_code = NULL WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'Studie erfolgreich unveröffentlicht' });
  } catch (error) {
    console.error('Fehler beim Unveröffentlichen der Studie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Participants Routes
app.post('/api/participants', async (req, res) => {
  try {
    const { studyId, limesurveyId } = req.body;
    const participantCode = generateParticipantCode();
    
    const [result] = await pool.execute(
      'INSERT INTO participants (study_id, participant_code, limesurvey_id) VALUES (?, ?, ?)',
      [studyId, participantCode, limesurveyId]
    );
    
    res.json({ id: result.insertId, participantCode, limesurveyId });
  } catch (error) {
    console.error('Fehler beim Erstellen des Teilnehmers:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Audio upload routes
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Audiodatei hochgeladen' });
  }
  
  res.json({ 
    message: 'Audiodatei erfolgreich hochgeladen',
    filename: req.file.filename,
    path: req.file.path
  });
});

app.get('/api/audio/files', (req, res) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Lesen des Upload-Verzeichnisses' });
    }
    const audioFiles = files.filter(file => file.endsWith('.wav') || file.endsWith('.mp3'));
    res.json(audioFiles);
  });
});

app.delete('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Löschen der Datei' });
    }
    res.json({ message: 'Datei erfolgreich gelöscht' });
  });
});

// Responses Routes
app.post('/api/responses', async (req, res) => {
  try {
    const { participantCode, studyId, responseData } = req.body;
    
    let participantId;
    const [existingParticipants] = await pool.execute(
      'SELECT id FROM participants WHERE participant_code = ?',
      [participantCode]
    );
    
    if (existingParticipants.length > 0) {
      participantId = existingParticipants[0].id;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO participants (study_id, participant_code) VALUES (?, ?)',
        [studyId, participantCode]
      );
      participantId = result.insertId;
    }
    
    const [result] = await pool.execute(
      'INSERT INTO responses (participant_id, study_id, response_data) VALUES (?, ?, ?)',
      [participantId, studyId, JSON.stringify(responseData)]
    );
    
    res.json({ 
      id: result.insertId, 
      participantId, 
      studyId, 
      responseData,
      message: 'Antwort erfolgreich gespeichert'
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Antwort:', error);
    res.status(500).json({ error: 'Serverfehler beim Speichern der Antwort' });
  }
});

app.get('/api/responses/:participantId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM responses WHERE participant_id = ? ORDER BY created_at DESC',
      [req.params.participantId]
    );
    
    const responses = rows.map(row => ({
      ...row,
      response_data: JSON.parse(row.response_data)
    }));
    
    res.json(responses);
  } catch (error) {
    console.error('Fehler beim Abrufen der Antworten:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Export Routes (simplified versions)
app.get('/api/export/:studyId/geojson', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.response_data, p.participant_code 
      FROM responses r 
      JOIN participants p ON r.participant_id = p.id 
      WHERE r.study_id = ?
    `, [req.params.studyId]);
    
    const features = [];
    rows.forEach(row => {
      const data = JSON.parse(row.response_data);
      if (data.features) {
        data.features.forEach(feature => {
          features.push({
            ...feature,
            properties: {
              ...feature.properties,
              participant_code: row.participant_code
            }
          });
        });
      }
    });
    
    res.json({
      type: 'FeatureCollection',
      features: features
    });
  } catch (error) {
    console.error('Fehler beim Export:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.get('/api/export/:studyId/participants', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.id, p.participant_code, p.limesurvey_id, p.created_at,
             COUNT(r.id) as response_count
      FROM participants p
      LEFT JOIN responses r ON p.id = r.participant_id
      WHERE p.study_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.params.studyId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Teilnehmer:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Public study access
app.get('/api/studies/:id/public', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, title, description, instructions, access_code FROM studies WHERE id = ? AND published = TRUE',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Studie nicht gefunden oder nicht veröffentlicht' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der öffentlichen Studie:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.post('/api/studies/:id/verify-access', async (req, res) => {
  try {
    const { accessCode } = req.body;
    const [rows] = await pool.execute(
      'SELECT id, title, description, instructions FROM studies WHERE id = ? AND access_code = ? AND published = TRUE',
      [req.params.id, accessCode]
    );
    
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Ungültiger Zugangscode' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Fehler bei der Zugangscode-Überprüfung:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Admin Routes
app.get('/api/admin/pending-users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, institution, department, created_at FROM users WHERE pending = TRUE AND approved = FALSE ORDER BY created_at DESC'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der ausstehenden Benutzer:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.post('/api/admin/approve-user/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }
    
    await pool.execute(
      'UPDATE users SET approved = TRUE, pending = FALSE WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Benutzer erfolgreich genehmigt' });
  } catch (error) {
    console.error('Fehler beim Genehmigen des Benutzers:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

app.post('/api/admin/reject-user/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }
    
    await pool.execute('DELETE FROM users WHERE id = ? AND pending = TRUE', [req.params.id]);
    
    res.json({ message: 'Benutzer erfolgreich abgelehnt und gelöscht' });
  } catch (error) {
    console.error('Fehler beim Ablehnen des Benutzers:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Produktions-spezifische Fehlerbehandlung
app.use((error, req, res, next) => {
  console.error('Unbehandelter Fehler:', error);
  
  // In Produktion keine detaillierten Fehlermeldungen an Client senden
  if (process.env.NODE_ENV === 'production') {
    return sendLocalizedResponse(res, 500, 'server.internal_error', req.language);
  } else {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM empfangen, beende Server graceful...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT empfangen, beende Server graceful...');
  await pool.end();
  process.exit(0);
});

// Server starten
app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log(`Mental Map Tool Server läuft in Produktionsmodus auf Port ${PORT}`);
  console.log(`Datenbankverbindung: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

module.exports = app;