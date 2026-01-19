const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'mentalmap_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  database: process.env.DB_NAME || 'mentalmap',
};

async function checkGeometry() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');

    const [studies] = await connection.execute('SELECT id, name FROM studies');
    console.log('Studies:', studies);

    for (const study of studies) {
      console.log(`\nChecking responses for study ${study.id} (${study.name})...`);
      const [responses] = await connection.execute(`
        SELECT r.id, r.geometry 
        FROM responses r
        JOIN participants p ON r.participant_id = p.id
        WHERE p.study_id = ?
        LIMIT 5
      `, [study.id]);

      if (responses.length === 0) {
        console.log('No responses found for this study.');
      } else {
        console.log(`Found ${responses.length} sample responses.`);
        responses.forEach(r => {
          console.log(`Response ID: ${r.id}`);
          try {
            const geo = JSON.parse(r.geometry);
            console.log('Root Type:', geo.type);
            if (geo.features && geo.features.length > 0) {
              const firstFeature = geo.features[0];
              console.log('First Feature:', JSON.stringify(firstFeature, null, 2));
            } else {
               console.log('No features or empty features array.');
            }
          } catch (e) {
            console.log('Error parsing geometry JSON:', e.message);
            console.log('Raw content:', r.geometry.substring(0, 100));
          }
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

checkGeometry();
