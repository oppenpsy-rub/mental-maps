const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mentalmap_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function checkData() {
    try {
        const pool = mysql.createPool(dbConfig);
        
        // Hole eine Antwort für Studie 1
        const [rows] = await pool.execute(`
            SELECT r.geometry 
            FROM responses r
            JOIN participants p ON r.participant_id = p.id
            WHERE p.study_id = 1
            LIMIT 1
        `);

        if (rows.length === 0) {
            console.log("Keine Daten gefunden für Studie 1");
        } else {
            console.log("Raw DB Geometry (substring):", rows[0].geometry.substring(0, 200));
            
            try {
                const parsed = JSON.parse(rows[0].geometry);
                console.log("Parsed Type:", parsed.type);
                
                if (parsed.type === "FeatureCollection") {
                    console.log("Features count:", parsed.features.length);
                    if (parsed.features.length > 0) {
                        const f = parsed.features[0];
                        console.log("First Feature Type:", f.type);
                        console.log("First Feature Geometry Type:", f.geometry ? f.geometry.type : 'undefined');
                        
                        if (f.geometry && f.geometry.type === "Feature") {
                             console.log("⚠️ NESTED FEATURE DETECTED!");
                             console.log("Inner Geometry Type:", f.geometry.geometry ? f.geometry.geometry.type : 'undefined');
                        }
                    }
                } else {
                    console.log("Not a FeatureCollection");
                }
            } catch (e) {
                console.error("JSON Parse Error:", e);
            }
        }
        
        await pool.end();
    } catch (err) {
        console.error("DB Error:", err);
    }
}

checkData();
