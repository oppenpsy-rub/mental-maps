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

async function checkMySQLDatabase() {
  let connection;
  
  try {
    console.log('=== MYSQL DATENBANK VERBINDUNG PRÜFEN ===');
    console.log('Verbindungsparameter:');
    console.log(`Host: ${dbConfig.host}`);
    console.log(`Port: ${dbConfig.port}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`Database: ${dbConfig.database}`);
    
    // Verbindung herstellen
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL Verbindung erfolgreich');
    
    // Teilnehmer zählen
    const [participantRows] = await connection.execute('SELECT COUNT(*) as total FROM participants');
    console.log(`\nGesamte Teilnehmer: ${participantRows[0].total}`);
    
    // Antworten zählen
    const [responseRows] = await connection.execute('SELECT COUNT(*) as total FROM responses');
    console.log(`Gesamte Antworten: ${responseRows[0].total}`);
    
    // Studien zählen
    const [studyRows] = await connection.execute('SELECT COUNT(*) as total FROM studies');
    console.log(`Gesamte Studien: ${studyRows[0].total}`);
    
    // Teilnehmer mit Antworten zählen
    const [withResponsesRows] = await connection.execute(`
      SELECT COUNT(DISTINCT p.id) as with_responses 
      FROM participants p 
      INNER JOIN responses r ON p.id = r.participant_id
    `);
    console.log(`Teilnehmer mit Antworten: ${withResponsesRows[0].with_responses}`);
    
    // Für jede Studie die Teilnehmer zählen
    const [studies] = await connection.execute('SELECT id, name FROM studies');
    console.log('\n=== TEILNEHMER PRO STUDIE ===');
    
    for (const study of studies) {
      const [studyParticipants] = await connection.execute(
        'SELECT COUNT(*) as participant_count FROM participants WHERE study_id = ?',
        [study.id]
      );
      console.log(`Studie "${study.name}" (ID: ${study.id}): ${studyParticipants[0].participant_count} Teilnehmer`);
    }
    
  } catch (error) {
    console.error('❌ Fehler bei der MySQL Verbindung:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('MySQL Server ist nicht erreichbar. Ist MySQL gestartet?');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Zugriff verweigert. Überprüfen Sie Benutzername und Passwort.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('Datenbank existiert nicht.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMySQLDatabase();