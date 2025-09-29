const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createLocalizedResponse } = require('./i18n');
const router = express.Router();

// JWT Secret Key - sollte in einer .env-Datei gespeichert werden
const JWT_SECRET = process.env.JWT_SECRET || 'mental-maps-secret-key';

module.exports = (db) => {
  // Benutzer registrieren
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      // Überprüfen, ob der Benutzer bereits existiert
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          const response = createLocalizedResponse(req, 'database_error', 500);
          return res.status(response.statusCode).json(response.data);
        }
        
        if (user) {
          const response = createLocalizedResponse(req, 'user_already_exists', 400);
          return res.status(response.statusCode).json(response.data);
        }
        
        // Passwort hashen
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Benutzer in Datenbank speichern
        db.run(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name, email, hashedPassword, 'researcher'],
          function(err) {
            if (err) {
              const response = createLocalizedResponse(req, 'user_creation_error', 500);
              return res.status(response.statusCode).json(response.data);
            }
            
            const userId = this.lastID;
            
            // JWT Token erstellen
            const token = jwt.sign(
              { id: userId, email, role: 'researcher' },
              JWT_SECRET,
              { expiresIn: '24h' }
            );
            
            const response = createLocalizedResponse(req, 'user_created_successfully', 201, {
              token,
              user: {
                id: userId,
                name,
                email,
                role: 'researcher'
              }
            });
            
            res.status(response.statusCode).json(response.data);
          }
        );
      });
    } catch (error) {
      console.error('Registrierungsfehler:', error);
      const response = createLocalizedResponse(req, 'server_error_registration', 500);
      res.status(response.statusCode).json(response.data);
    }
  });

  // Benutzer anmelden
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Benutzer in Datenbank suchen
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          const response = createLocalizedResponse(req, 'database_error', 500);
          return res.status(response.statusCode).json(response.data);
        }
        
        if (!user) {
          const response = createLocalizedResponse(req, 'invalid_credentials', 400);
          return res.status(response.statusCode).json(response.data);
        }
        
        // Passwort überprüfen
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          const response = createLocalizedResponse(req, 'invalid_credentials', 400);
          return res.status(response.statusCode).json(response.data);
        }
        
        // JWT Token erstellen
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        const response = createLocalizedResponse(req, 'login_successful', 200, {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
        
        res.status(response.statusCode).json(response.data);
      });
    } catch (error) {
      console.error('Anmeldefehler:', error);
      const response = createLocalizedResponse(req, 'server_error_login', 500);
      res.status(response.statusCode).json(response.data);
    }
  });

  // Aktuellen Benutzer abrufen
  router.get('/me', (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        const response = createLocalizedResponse(req, 'access_denied', 401);
        return res.status(response.statusCode).json(response.data);
      }
      
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          const response = createLocalizedResponse(req, 'invalid_token', 403);
          return res.status(response.statusCode).json(response.data);
        }
        
        // Benutzer aus Datenbank abrufen
        db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
          if (err) {
            const response = createLocalizedResponse(req, 'database_error', 500);
            return res.status(response.statusCode).json(response.data);
          }
          
          if (!user) {
            const response = createLocalizedResponse(req, 'user_not_found', 404);
            return res.status(response.statusCode).json(response.data);
          }
          
          res.json({ user });
        });
      });
    } catch (error) {
      console.error('Fehler beim Abrufen des Benutzers:', error);
      const response = createLocalizedResponse(req, 'internal_server_error', 500);
      res.status(response.statusCode).json(response.data);
    }
  });

  return router;
};

// Middleware zur Token-Überprüfung
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    const response = createLocalizedResponse(req, 'access_denied', 401);
    return res.status(response.statusCode).json(response.data);
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      const response = createLocalizedResponse(req, 'invalid_token', 403);
      return res.status(response.statusCode).json(response.data);
    }
    
    req.user = decoded;
    next();
  });
};

// Middleware zur Überprüfung der Forscher-Rolle
const requireResearcher = (req, res, next) => {
  if (req.user.role !== 'researcher') {
    const response = createLocalizedResponse(req, 'no_permission', 403);
    return res.status(response.statusCode).json(response.data);
  }
  next();
};

module.exports.authenticateToken = authenticateToken;
module.exports.requireResearcher = requireResearcher;