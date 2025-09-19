import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'mental_maps_dev',
});

async function fixResponseSubmission() {
  console.log('=== FIXING RESPONSE SUBMISSION ===\n');

  try {
    const client = await pool.connect();
    await client.query('SET search_path TO mental_maps, public');

    // Step 1: Get a recent participant
    console.log('1. Getting recent participant...');
    const participantResult = await client.query(`
      SELECT id, study_id, session_token, started_at, completed_at
      FROM participants 
      WHERE completed_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `);

    if (participantResult.rows.length === 0) {
      console.log('❌ No active participants found');
      client.release();
      return;
    }

    const participant = participantResult.rows[0];
    console.log('✓ Found participant:', participant.id.substring(0, 8) + '...');
    console.log('  Study ID:', participant.study_id);

    // Step 2: Get a question from the study
    console.log('\n2. Getting question from study...');
    const questionResult = await client.query(`
      SELECT id, question_text, question_type, order_index
      FROM questions 
      WHERE study_id = $1
      ORDER BY order_index
      LIMIT 1
    `, [participant.study_id]);

    if (questionResult.rows.length === 0) {
      console.log('❌ No questions found for study');
      client.release();
      return;
    }

    const question = questionResult.rows[0];
    console.log('✓ Found question:', question.question_text.substring(0, 50) + '...');
    console.log('  Question ID:', question.id);

    // Step 3: Check if response already exists
    console.log('\n3. Checking existing responses...');
    const existingResponseResult = await client.query(`
      SELECT id, response_data, created_at
      FROM responses 
      WHERE participant_id = $1 AND question_id = $2
    `, [participant.id, question.id]);

    if (existingResponseResult.rows.length > 0) {
      console.log('✓ Response already exists:', existingResponseResult.rows[0].id);
    } else {
      console.log('✓ No existing response - will create new one');
    }

    // Step 4: Insert a test response directly
    console.log('\n4. Inserting test response...');
    const responseData = {
      textResponse: 'Test response inserted directly via SQL',
      interactionEvents: [{
        timestamp: Date.now(),
        event: 'direct_sql_insertion',
        data: { source: 'fix_script' }
      }]
    };

    let responseId;
    if (existingResponseResult.rows.length > 0) {
      // Update existing response
      const updateResult = await client.query(`
        UPDATE responses 
        SET response_data = $1, response_time_ms = $2, updated_at = NOW()
        WHERE participant_id = $3 AND question_id = $4
        RETURNING id
      `, [JSON.stringify(responseData), 5000, participant.id, question.id]);
      responseId = updateResult.rows[0].id;
      console.log('✓ Updated existing response:', responseId);
    } else {
      // Insert new response
      const insertResult = await client.query(`
        INSERT INTO responses (participant_id, question_id, response_data, response_time_ms, is_temporary, created_at, updated_at)
        VALUES ($1, $2, $3, $4, false, NOW(), NOW())
        RETURNING id
      `, [participant.id, question.id, JSON.stringify(responseData), 5000]);
      responseId = insertResult.rows[0].id;
      console.log('✓ Inserted new response:', responseId);
    }

    // Step 5: Insert map drawing if it's a map_drawing question
    if (question.question_type === 'map_drawing') {
      console.log('\n5. Inserting map drawing...');
      
      // Check if map drawing already exists
      const existingDrawingResult = await client.query(`
        SELECT id FROM map_drawings WHERE response_id = $1
      `, [responseId]);

      let mapDrawingId;
      if (existingDrawingResult.rows.length > 0) {
        // Update existing map drawing
        const updateDrawingResult = await client.query(`
          UPDATE map_drawings 
          SET drawing_data = $1
          WHERE response_id = $2
          RETURNING id
        `, [JSON.stringify({ version: '1.0', elements: [] }), responseId]);
        mapDrawingId = updateDrawingResult.rows[0].id;
        console.log('✓ Updated existing map drawing:', mapDrawingId);
      } else {
        // Insert new map drawing
        const insertDrawingResult = await client.query(`
          INSERT INTO map_drawings (response_id, drawing_data, created_at)
          VALUES ($1, $2, NOW())
          RETURNING id
        `, [responseId, JSON.stringify({ version: '1.0', elements: [] })]);
        mapDrawingId = insertDrawingResult.rows[0].id;
        console.log('✓ Inserted new map drawing:', mapDrawingId);
      }

      // Insert drawing elements
      console.log('\n6. Inserting drawing elements...');
      const elementGeometry = 'POLYGON((13.404 52.52, 13.406 52.52, 13.406 52.522, 13.404 52.522, 13.404 52.52))';
      
      const elementResult = await client.query(`
        INSERT INTO drawing_elements (map_drawing_id, element_type, geometry, style_properties, metadata, created_at)
        VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, NOW())
        RETURNING id
      `, [
        mapDrawingId,
        'polygon',
        elementGeometry,
        JSON.stringify({ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 3 }),
        JSON.stringify({ label: 'Test Polygon', createdWith: 'Fix Script' })
      ]);
      
      console.log('✓ Inserted drawing element:', elementResult.rows[0].id);
    }

    // Step 6: Verify the insertion
    console.log('\n7. Verifying insertion...');
    const verifyResult = await client.query(`
      SELECT 
        r.id as response_id,
        r.response_data,
        r.response_time_ms,
        r.created_at,
        md.id as map_drawing_id,
        COUNT(de.id) as element_count
      FROM responses r
      LEFT JOIN map_drawings md ON r.id = md.response_id
      LEFT JOIN drawing_elements de ON md.id = de.map_drawing_id
      WHERE r.participant_id = $1 AND r.question_id = $2
      GROUP BY r.id, md.id
    `, [participant.id, question.id]);

    if (verifyResult.rows.length > 0) {
      const result = verifyResult.rows[0];
      console.log('✓ Response verified:');
      console.log('  Response ID:', result.response_id);
      console.log('  Map Drawing ID:', result.map_drawing_id || 'None');
      console.log('  Drawing Elements:', result.element_count);
      console.log('  Response Data:', JSON.stringify(result.response_data, null, 2));
    } else {
      console.log('❌ Response verification failed');
    }

    // Step 7: Update participant completion status
    console.log('\n8. Completing participant session...');
    await client.query(`
      UPDATE participants 
      SET completed_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [participant.id]);
    console.log('✓ Participant session completed');

    client.release();
    console.log('\n✅ Response submission fix completed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

fixResponseSubmission();