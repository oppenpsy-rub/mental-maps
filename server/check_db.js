const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mentalmap.db');

db.serialize(() => {
  // Alle Tabellen auflisten
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Fehler beim Abrufen der Tabellen:', err);
      return;
    }
    
    console.log('=== TABELLEN ===');
    tables.forEach(table => console.log(table.name));
    
    // Schema für jede Tabelle anzeigen
    let completed = 0;
    tables.forEach(table => {
      console.log(`\n=== SCHEMA: ${table.name} ===`);
      db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
        if (err) {
          console.error(`Fehler beim Abrufen des Schemas für ${table.name}:`, err);
        } else {
          columns.forEach(col => {
            console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
          });
        }
        
        // Beispieldaten anzeigen
        console.log(`\n=== BEISPIELDATEN: ${table.name} ===`);
        db.all(`SELECT * FROM ${table.name} LIMIT 3`, (err, rows) => {
          if (err) {
            console.error(`Fehler beim Abrufen der Daten für ${table.name}:`, err);
          } else {
            console.log(`Anzahl Zeilen: ${rows.length}`);
            if (rows.length > 0) {
              console.log('Erste Zeile:', JSON.stringify(rows[0], null, 2));
            }
          }
          
          completed++;
          if (completed === tables.length) {
            db.close();
          }
        });
      });
    });
  });
});