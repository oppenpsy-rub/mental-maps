const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mentalmap.db');

db.serialize(() => {
  console.log('=== DEBUG: ANTWORTEN-TABELLE ===');
  
  // Direkte Abfrage der responses-Tabelle
  db.all('SELECT * FROM responses LIMIT 5', (err, rows) => {
    if (err) {
      console.error('Fehler bei responses:', err);
    } else {
      console.log(`Direkte responses-Abfrage: ${rows.length} Zeilen`);
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Participant: ${row.participant_id}, Question: ${row.question_id}`);
      });
    }
    
    // Prüfe participants-Tabelle
    db.all('SELECT id, code FROM participants LIMIT 5', (err, participants) => {
      if (err) {
        console.error('Fehler bei participants:', err);
      } else {
        console.log(`\nParticipants: ${participants.length} Zeilen (erste 5)`);
        participants.forEach((p, index) => {
          console.log(`${index + 1}. ID: ${p.id}, Code: ${p.code}`);
        });
      }
      
      // Prüfe JOIN-Problem
      db.all(`
        SELECT 
          r.id as response_id,
          r.participant_id,
          p.id as participant_table_id,
          p.code
        FROM responses r
        LEFT JOIN participants p ON r.participant_id = p.id
        LIMIT 5
      `, (err, joined) => {
        if (err) {
          console.error('Fehler bei JOIN:', err);
        } else {
          console.log(`\nJOIN-Test: ${joined.length} Zeilen`);
          joined.forEach((j, index) => {
            console.log(`${index + 1}. Response: ${j.response_id}, Participant_ID: ${j.participant_id}, Found: ${j.participant_table_id}, Code: ${j.code}`);
          });
        }
        
        db.close();
      });
    });
  });
});