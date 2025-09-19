import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkStudySettings() {
    const connection = await createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mental_maps'
    });

    try {
        console.log('=== Checking Studies Table Structure ===');
        
        // Check table structure
        const [columns] = await connection.execute('DESCRIBE studies');
        console.log('Studies table columns:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });

        console.log('\n=== Current Study Settings ===');
        
        // Get all studies with their settings
        const [studies] = await connection.execute(
            'SELECT id, title, settings, active FROM studies'
        );
        
        studies.forEach(study => {
            console.log(`\nStudy: ${study.title} (ID: ${study.id})`);
            console.log(`Active: ${study.active}`);
            console.log('Settings:');
            
            if (study.settings) {
                try {
                    const settings = JSON.parse(study.settings);
                    console.log(JSON.stringify(settings, null, 2));
                } catch (e) {
                    console.log('  Invalid JSON:', study.settings);
                }
            } else {
                console.log('  No settings found');
            }
        });

        console.log('\n=== Checking specific study ===');
        const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
        const [specificStudy] = await connection.execute(
            'SELECT * FROM studies WHERE id = ?',
            [studyId]
        );
        
        if (specificStudy.length > 0) {
            const study = specificStudy[0];
            console.log(`Study: ${study.title}`);
            console.log('Raw settings field:', study.settings);
            
            if (study.settings) {
                try {
                    const settings = JSON.parse(study.settings);
                    console.log('Parsed settings:');
                    console.log(JSON.stringify(settings, null, 2));
                    
                    if (settings.mapConfiguration) {
                        console.log('Map configuration found:');
                        console.log(JSON.stringify(settings.mapConfiguration, null, 2));
                    } else {
                        console.log('No mapConfiguration in settings');
                    }
                } catch (e) {
                    console.log('Error parsing settings JSON:', e.message);
                }
            }
        } else {
            console.log('Study not found');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkStudySettings();