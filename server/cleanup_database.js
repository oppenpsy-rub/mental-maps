const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mentalmap.db');

console.log('=== DATENBANK BEREINIGUNG GESTARTET ===');

db.serialize(() => {
  // Zuerst: Aktuelle Statistiken anzeigen
  console.log('\n=== AKTUELLE STATISTIKEN ===');
  
  db.get("SELECT COUNT(*) as total FROM participants", (err, result) => {
    if (err) {
      console.error('Fehler beim Zählen der Teilnehmer:', err);
      return;
    }
    console.log(`Gesamte Teilnehmer: ${result.total}`);
    
    // Teilnehmer mit Antworten zählen
    db.get(`
      SELECT COUNT(DISTINCT p.id) as with_responses 
      FROM participants p 
      INNER JOIN responses r ON p.code = r.participant_id
    `, (err, result) => {
      if (err) {
        console.error('Fehler beim Zählen der Teilnehmer mit Antworten:', err);
        return;
      }
      console.log(`Teilnehmer mit Antworten: ${result.with_responses}`);
      
      // Teilnehmer ohne Antworten zählen
      db.get(`
        SELECT COUNT(*) as without_responses 
        FROM participants p 
        LEFT JOIN responses r ON p.code = r.participant_id 
        WHERE r.participant_id IS NULL
      `, (err, result) => {
        if (err) {
          console.error('Fehler beim Zählen der Teilnehmer ohne Antworten:', err);
          return;
        }
        console.log(`Teilnehmer ohne Antworten: ${result.without_responses}`);
        
        if (result.without_responses > 0) {
          console.log('\n=== BEREINIGUNG WIRD DURCHGEFÜHRT ===');
          
          // Teilnehmer ohne Antworten löschen
          db.run(`
            DELETE FROM participants 
            WHERE id IN (
              SELECT p.id 
              FROM participants p 
              LEFT JOIN responses r ON p.code = r.participant_id 
              WHERE r.participant_id IS NULL
            )
          `, function(err) {
            if (err) {
              console.error('Fehler beim Löschen der Teilnehmer ohne Antworten:', err);
              return;
            }
            console.log(`✅ ${this.changes} Teilnehmer ohne Antworten wurden gelöscht`);
            
            // Neue Statistiken anzeigen
            console.log('\n=== NEUE STATISTIKEN ===');
            db.get("SELECT COUNT(*) as total FROM participants", (err, result) => {
              if (err) {
                console.error('Fehler beim Zählen der verbleibenden Teilnehmer:', err);
                return;
              }
              console.log(`Verbleibende Teilnehmer: ${result.total}`);
              
              // Antworten zählen
              db.get("SELECT COUNT(*) as total FROM responses", (err, result) => {
                if (err) {
                  console.error('Fehler beim Zählen der Antworten:', err);
                  return;
                }
                console.log(`Gesamte Antworten: ${result.total}`);
                
                console.log('\n=== BEREINIGUNG ABGESCHLOSSEN ===');
                db.close();
              });
            });
          });
        } else {
          console.log('\n✅ Keine Teilnehmer ohne Antworten gefunden. Bereinigung nicht erforderlich.');
          db.close();
        }
      });
    });
  });
});