const mysql = require('mysql2/promise');

// MySQL Datenbank Konfiguration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'mentalmap_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  database: process.env.DB_NAME || 'mentalmap',
};

async function updateUsersTable() {
  let connection;
  
  try {
    // Verbindung zur Datenbank herstellen
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Verbindung zur MySQL-Datenbank hergestellt');
    
    // Aktuelle Tabellenstruktur prüfen
    console.log('\n📋 Prüfe aktuelle Tabellenstruktur...');
    const [columns] = await connection.execute('DESCRIBE users');
    const existingColumns = columns.map(col => col.Field);
    console.log('Vorhandene Spalten:', existingColumns);
    
    // Institution Spalte hinzufügen, falls sie nicht existiert
    if (!existingColumns.includes('institution')) {
      console.log('\n➕ Füge institution Spalte hinzu...');
      await connection.execute('ALTER TABLE users ADD COLUMN institution VARCHAR(255) DEFAULT NULL');
      console.log('✅ institution Spalte erfolgreich hinzugefügt');
    } else {
      console.log('✅ institution Spalte existiert bereits');
    }
    
    // Department Spalte hinzufügen, falls sie nicht existiert
    if (!existingColumns.includes('department')) {
      console.log('\n➕ Füge department Spalte hinzu...');
      await connection.execute('ALTER TABLE users ADD COLUMN department VARCHAR(255) DEFAULT NULL');
      console.log('✅ department Spalte erfolgreich hinzugefügt');
    } else {
      console.log('✅ department Spalte existiert bereits');
    }
    
    // Finale Tabellenstruktur anzeigen
    console.log('\n📊 Finale Tabellenstruktur:');
    const [finalColumns] = await connection.execute('DESCRIBE users');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n🎉 Tabellen-Update erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Tabelle:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Datenbankverbindung geschlossen');
    }
  }
}

// Script ausführen
updateUsersTable();