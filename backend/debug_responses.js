import { AppDataSource } from './src/database/connection.ts';

async function debugResponses() {
  try {
    await AppDataSource.initialize();
    console.log('=== Debugging Response Submission ===');

    // Monitor responses table
    const responses = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM mental_maps.responses
    `);
    console.log('Current responses count:', responses[0].count);

    // Monitor map_drawings table
    const drawings = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM mental_maps.map_drawings
    `);
    console.log('Current map_drawings count:', drawings[0].count);

    // Monitor drawing_elements table
    const elements = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM mental_maps.drawing_elements
    `);
    console.log('Current drawing_elements count:', elements[0].count);

    // Show recent participants
    const recentParticipants = await AppDataSource.query(`
      SELECT id, study_id, started_at, completed_at
      FROM mental_maps.participants 
      ORDER BY started_at DESC 
      LIMIT 5
    `);
    console.log('\n=== Recent Participants ===');
    recentParticipants.forEach(p => {
      console.log(`- ${p.id.substring(0, 8)}... (Study: ${p.study_id.substring(0, 8)}...)`);
      console.log(`  Started: ${p.started_at}, Completed: ${p.completed_at || 'Not completed'}`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugResponses();