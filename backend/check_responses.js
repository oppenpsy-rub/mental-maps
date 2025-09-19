import { AppDataSource } from './src/database/connection.ts';

async function checkResponses() {
  try {
    await AppDataSource.initialize();
    console.log('=== Checking Responses and Mental Maps ===');

    // Check participants
    const participantsQuery = `
      SELECT 
        id, 
        study_id, 
        session_token,
        started_at,
        completed_at
      FROM mental_maps.participants 
      ORDER BY started_at DESC
    `;
    const participants = await AppDataSource.query(participantsQuery);
    console.log(`\n=== Participants (${participants.length}) ===`);
    participants.forEach(p => {
      console.log(`- ${p.id.substring(0, 8)}... (Study: ${p.study_id.substring(0, 8)}...)`);
      console.log(`  Started: ${p.started_at}, Completed: ${p.completed_at || 'Not completed'}`);
    });

    // Check responses
    const responsesQuery = `
      SELECT 
        r.id,
        r.participant_id,
        r.question_id,
        r.response_time_ms,
        r.created_at,
        q.question_text as question_title
      FROM mental_maps.responses r
      JOIN mental_maps.questions q ON r.question_id = q.id
      ORDER BY r.created_at DESC
    `;
    const responses = await AppDataSource.query(responsesQuery);
    console.log(`\n=== Responses (${responses.length}) ===`);
    responses.forEach(r => {
      console.log(`- Response ${r.id.substring(0, 8)}... by participant ${r.participant_id.substring(0, 8)}...`);
      console.log(`  Question: ${r.question_title}`);
      console.log(`  Time: ${r.response_time_ms}ms, Created: ${r.created_at}`);
    });

    // Check map drawings
    const drawingsQuery = `
      SELECT 
        md.id,
        md.response_id,
        md.drawing_data,
        md.created_at,
        r.participant_id
      FROM mental_maps.map_drawings md
      JOIN mental_maps.responses r ON md.response_id = r.id
      ORDER BY md.created_at DESC
    `;
    const drawings = await AppDataSource.query(drawingsQuery);
    console.log(`\n=== Map Drawings (${drawings.length}) ===`);
    drawings.forEach(d => {
      console.log(`- Drawing ${d.id.substring(0, 8)}... by participant ${d.participant_id.substring(0, 8)}...`);
      console.log(`  Response: ${d.response_id.substring(0, 8)}...`);
      console.log(`  Created: ${d.created_at}`);
      console.log(`  Drawing Data: ${JSON.stringify(d.drawing_data).substring(0, 100)}...`);
    });

    // Check drawing elements
    const elementsQuery = `
      SELECT 
        de.id,
        de.map_drawing_id,
        de.element_type,
        de.style_properties,
        de.metadata,
        ST_AsGeoJSON(de.geometry) as geometry_json
      FROM mental_maps.drawing_elements de
      ORDER BY de.created_at DESC
    `;
    const elements = await AppDataSource.query(elementsQuery);
    console.log(`\n=== Drawing Elements (${elements.length}) ===`);
    elements.forEach(e => {
      console.log(`- Element ${e.id.substring(0, 8)}... (${e.element_type})`);
      console.log(`  Drawing: ${e.map_drawing_id.substring(0, 8)}...`);
      console.log(`  Style: ${JSON.stringify(e.style_properties)}`);
      console.log(`  Geometry: ${e.geometry_json ? e.geometry_json.substring(0, 100) + '...' : 'None'}`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkResponses();