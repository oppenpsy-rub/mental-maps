const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mentalmap.db');

console.log('=== AKTUELLE TEILNEHMER-STATISTIKEN ===');

db.serialize(() => {
  // Gesamte Teilnehmer zählen
  db.get("SELECT COUNT(*) as total FROM participants", (err, result) => {
    if (err) {
      console.error('Fehler beim Zählen der Teilnehmer:', err);
      return;
    }
    console.log(`Gesamte Teilnehmer in der Datenbank: ${result.total}`);
    
    // Teilnehmer mit Antworten zählen
    db.get(`
      SELECT COUNT(DISTINCT p.id) as with_responses 
      FROM participants p 
      INNER JOIN responses r ON p.id = r.participant_id
    `, (err, result) => {
      if (err) {
        console.error('Fehler beim Zählen der Teilnehmer mit Antworten:', err);
        return;
      }
      console.log(`Teilnehmer mit Antworten: ${result.with_responses}`);
      
      // Antworten zählen
      db.get("SELECT COUNT(*) as total FROM responses", (err, result) => {
        if (err) {
          console.error('Fehler beim Zählen der Antworten:', err);
          return;
        }
        console.log(`Gesamte Antworten: ${result.total}`);
        
        // Studien zählen
        db.get("SELECT COUNT(*) as total FROM studies", (err, result) => {
          if (err) {
            console.error('Fehler beim Zählen der Studien:', err);
            return;
          }
          console.log(`Gesamte Studien: ${result.total}`);
          
          // Für jede Studie die Teilnehmer zählen
          db.all("SELECT id, name FROM studies", (err, studies) => {
            if (err) {
              console.error('Fehler beim Laden der Studien:', err);
              return;
            }
            
            console.log('\n=== TEILNEHMER PRO STUDIE ===');
            let studiesProcessed = 0;
            
            studies.forEach(study => {
              db.get(`
                SELECT COUNT(*) as participant_count
                FROM participants 
                WHERE study_id = ?
              `, [study.id], (err, result) => {
                if (err) {
                  console.error(`Fehler beim Zählen der Teilnehmer für Studie ${study.id}:`, err);
                } else {
                  console.log(`Studie "${study.name}" (ID: ${study.id}): ${result.participant_count} Teilnehmer`);
                }
                
                studiesProcessed++;
                if (studiesProcessed === studies.length) {
                  db.close();
                }
              });
            });
            
            if (studies.length === 0) {
              console.log('Keine Studien gefunden.');
              db.close();
            }
          });
        });
      });
    });
  });
});