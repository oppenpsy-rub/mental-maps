import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixStudyConfig() {
    const connection = await createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mental_maps'
    });

    try {
        const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
        
        // Get current study
        const [rows] = await connection.execute(
            'SELECT * FROM studies WHERE id = ?',
            [studyId]
        );
        
        if (rows.length === 0) {
            console.log('Study not found');
            return;
        }
        
        const study = rows[0];
        console.log('Current study settings:', study.settings);
        
        // Create default map configuration
        const defaultMapConfig = {
            mapConfiguration: {
                initialBounds: {
                    north: 52.5,
                    south: 52.4,
                    east: 13.5,
                    west: 13.3
                },
                initialZoom: 12,
                minZoom: 8,
                maxZoom: 18,
                center: [52.45, 13.4],
                mapStyle: 'standard',
                enabledTools: ['pen', 'line', 'polygon', 'circle', 'text', 'marker'],
                customLayers: []
            },
            participantSettings: {
                allowSkipQuestions: false,
                showProgressIndicator: true,
                enableAutoSave: true,
                autoSaveInterval: 30000
            },
            dataCollection: {
                collectDrawingData: true,
                collectInteractionData: true,
                collectTimingData: true
            }
        };
        
        // Update study with map configuration
        await connection.execute(
            'UPDATE studies SET settings = ? WHERE id = ?',
            [JSON.stringify(defaultMapConfig), studyId]
        );
        
        console.log('✓ Study updated with map configuration');
        
        // Verify update
        const [updatedRows] = await connection.execute(
            'SELECT settings FROM studies WHERE id = ?',
            [studyId]
        );
        
        console.log('Updated settings:', JSON.parse(updatedRows[0].settings));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

fixStudyConfig();