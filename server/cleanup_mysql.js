const mysql = require('mysql2/promise');
require('dotenv').config();

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

async function cleanMySQLDatabase() {
  let connection;
  
  try {
    console.log('=== MYSQL DATENBANK BEREINIGUNG GESTARTET ===');
    
    // Verbindung herstellen
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL Verbindung erfolgreich');
    
    // Aktuelle Statistiken anzeigen
    console.log('\n=== AKTUELLE STATISTIKEN ===');
    
    const [totalParticipants] = await connection.execute('SELECT COUNT(*) as total FROM participants');
    console.log(`Gesamte Teilnehmer: ${totalParticipants[0].total}`);
    
    const [withResponses] = await connection.execute(`
      SELECT COUNT(DISTINCT p.id) as with_responses 
      FROM participants p 
      INNER JOIN responses r ON p.id = r.participant_id
    `);
    console.log(`Teilnehmer mit Antworten: ${withResponses[0].with_responses}`);
    
    const [withoutResponses] = await connection.execute(`
      SELECT COUNT(*) as without_responses 
      FROM participants p 
      LEFT JOIN responses r ON p.id = r.participant_id 
      WHERE r.participant_id IS NULL
    `);
    console.log(`Teilnehmer ohne Antworten: ${withoutResponses[0].without_responses}`);
    
    if (withoutResponses[0].without_responses > 0) {
      console.log('\n=== BEREINIGUNG WIRD DURCHGEFÜHRT ===');
      
      // Teilnehmer ohne Antworten löschen
      const [deleteResult] = await connection.execute(`
        DELETE FROM participants 
        WHERE id NOT IN (
          SELECT DISTINCT participant_id 
          FROM responses 
          WHERE participant_id IS NOT NULL
        )
      `);
      
      console.log(`✅ ${deleteResult.affectedRows} Teilnehmer ohne Antworten wurden gelöscht`);
      
      // Neue Statistiken anzeigen
      console.log('\n=== NEUE STATISTIKEN ===');
      
      const [newTotalParticipants] = await connection.execute('SELECT COUNT(*) as total FROM participants');
      console.log(`Verbleibende Teilnehmer: ${newTotalParticipants[0].total}`);
      
      const [totalResponses] = await connection.execute('SELECT COUNT(*) as total FROM responses');
      console.log(`Gesamte Antworten: ${totalResponses[0].total}`);
      
      console.log('\n✅ Datenbank-Bereinigung abgeschlossen!');
    } else {
      console.log('\n✅ Keine Teilnehmer ohne Antworten gefunden. Bereinigung nicht erforderlich.');
    }
    
  } catch (error) {
    console.error('❌ Fehler bei der Datenbank-Bereinigung:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanMySQLDatabase();