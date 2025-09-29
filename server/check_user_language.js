const mysql = require('mysql2/promise');

// MySQL Datenbank Konfiguration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'mentalmap_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  database: process.env.DB_NAME || 'mentalmap',
};

async function checkUserLanguages() {
  let connection;
  
  try {
    // Verbindung zur Datenbank herstellen
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Verbindung zur MySQL-Datenbank hergestellt');
    
    // Alle Benutzer und ihre Anmeldedaten abrufen
    console.log('\n📋 Benutzer und ihre Anmeldedaten:');
    const [users] = await connection.execute('SELECT id, name, email, language, password, updated_at FROM users');
    
    if (users.length === 0) {
      console.log('❌ Keine Benutzer in der Datenbank gefunden');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Sprache: ${user.language || 'NULL'}, Passwort-Hash: ${user.password}, Aktualisiert: ${user.updated_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Benutzerdaten:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Datenbankverbindung geschlossen');
    }
  }
}

// Script ausführen
checkUserLanguages();