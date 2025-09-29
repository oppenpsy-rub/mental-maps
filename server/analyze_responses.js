const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mentalmap.db');

db.serialize(() => {
  console.log('=== ANTWORTEN-ANALYSE ===');
  
  db.all(`
    SELECT 
      r.id,
      r.question_id,
      r.geometry,
      r.audio_file,
      r.created_at,
      p.code as participant_code
    FROM responses r
    JOIN participants p ON r.participant_id = p.id
    ORDER BY r.created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der Antworten:', err);
      db.close();
      return;
    }
    
    console.log(`Gesamtanzahl Antworten: ${rows.length}\n`);
    
    rows.forEach((response, index) => {
      console.log(`=== ANTWORT ${index + 1} ===`);
      console.log(`Teilnehmer: ${response.participant_code}`);
      console.log(`Frage: ${response.question_id}`);
      console.log(`Audio: ${response.audio_file || 'Keine'}`);
      console.log(`Erstellt: ${response.created_at}`);
      
      // Geometrie analysieren
      try {
        const geometry = JSON.parse(response.geometry);
        if (geometry.features && geometry.features.length > 0) {
          console.log(`Polygone: ${geometry.features.length}`);
          
          // Erste Koordinate des ersten Polygons für geografische Einordnung
          const firstFeature = geometry.features[0];
          if (firstFeature.geometry && firstFeature.geometry.coordinates && firstFeature.geometry.coordinates[0]) {
            const firstCoord = firstFeature.geometry.coordinates[0][0];
            const lon = firstCoord[0];
            const lat = firstCoord[1];
            console.log(`Erste Koordinate: [${lon.toFixed(4)}, ${lat.toFixed(4)}]`);
            
            // Grobe geografische Einordnung
            let region = 'Unbekannt';
            if (lon >= 5.5 && lon <= 10.5 && lat >= 45.5 && lat <= 47.8) {
              region = 'Schweiz';
            } else if (lon >= 2.2 && lon <= 8.2 && lat >= 42.3 && lat <= 51.1) {
              region = 'Frankreich';
            } else if (lon >= 6.0 && lon <= 15.0 && lat >= 47.3 && lat <= 55.1) {
              region = 'Deutschland';
            } else if (lon >= 9.5 && lon <= 17.2 && lat >= 46.4 && lat <= 49.0) {
              region = 'Österreich';
            } else if (lon >= 20.2 && lon <= 29.7 && lat >= 43.6 && lat <= 48.3) {
              region = 'Rumänien';
            } else if (lon >= 12.0 && lon <= 18.5 && lat >= 35.5 && lat <= 47.1) {
              region = 'Italien';
            } else if (lon >= -9.5 && lon <= 3.3 && lat >= 35.9 && lat <= 43.8) {
              region = 'Spanien';
            }
            
            console.log(`Geschätzte Region: ${region}`);
          }
        }
      } catch (e) {
        console.log('Fehler beim Parsen der Geometrie:', e.message);
      }
      
      console.log(''); // Leerzeile
    });
    
    db.close();
  });
});