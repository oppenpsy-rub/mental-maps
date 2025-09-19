import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'mental_maps_dev',
});

async function testFixedAPI() {
  console.log('=== TESTING FIXED API LOGIC ===\n');

  try {
    const client = await pool.connect();
    await client.query('SET search_path TO mental_maps, public');

    // Step 1: Create a new participant session (simulate API)
    console.log('1. Creating new participant session...');
    const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const participantResult = await client.query(`
      INSERT INTO participants (study_id, session_token, expires_at, consent_given, started_at, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, true, NOW(), $4, NOW(), NOW())
      RETURNING id
    `, [
      studyId,
      sessionToken,
      expiresAt,
      JSON.stringify({
        userAgent: 'Test Script',
        screenResolution: '1920x1080',
        timezone: 'Europe/Berlin',
        language: 'de-DE',
        timestamp: Date.now()
      })
    ]);

    const participantId = participantResult.rows[0].id;
    console.log('✓ Created participant:', participantId.substring(0, 8) + '...');
    console.log('✓ Session token:', sessionToken.substring(0, 20) + '...');

    // Step 2: Test study info logic (simulate getStudyQuestionsForParticipation)
    console.log('\n2. Testing study info logic...');
    
    // Check if study exists and is active
    const studyResult = await client.query(`
      SELECT id, title, active FROM studies WHERE id = $1
    `, [studyId]);

    if (studyResult.rows.length === 0) {
      console.log('❌ Study not found');
      client.release();
      return;
    }

    const study = studyResult.rows[0];
    if (!study.active) {
      console.log('❌ Study is not active');
      client.release();
      return;
    }

    console.log('✓ Study found and active:', study.title);

    // Get questions for the study
    const questionsResult = await client.query(`
      SELECT id, question_text, question_type, order_index, configuration
      FROM questions 
      WHERE study_id = $1
      ORDER BY order_index
    `, [studyId]);

    console.log(`✓ Found ${questionsResult.rows.length} questions`);
    const questions = questionsResult.rows;

    if (questions.length === 0) {
      console.log('❌ No questions found');
      client.release();
      return;
    }

    // Step 3: Test response submission logic
    console.log('\n3. Testing response submission logic...');
    const firstQuestion = questions[0];
    console.log('  Using question:', firstQuestion.question_text.substring(0, 50) + '...');

    // Simulate the fixed response submission
    const responseData = {
      textResponse: 'Test response from fixed API logic',
      interactionEvents: [{
        timestamp: Date.now(),
        event: 'api_test_submission',
        data: { source: 'fixed_api_test' }
      }]
    };

    // Insert response
    const responseResult = await client.query(`
      INSERT INTO responses (participant_id, question_id, response_data, response_time_ms, is_temporary, created_at, updated_at)
      VALUES ($1, $2, $3, $4, false, NOW(), NOW())
      RETURNING id
    `, [participantId, firstQuestion.id, JSON.stringify(responseData), 3000]);

    const responseId = responseResult.rows[0].id;
    console.log('✓ Created response:', responseId);

    // Step 4: Test map drawing submission (if it's a map_drawing question)
    if (firstQuestion.question_type === 'map_drawing') {
      console.log('\n4. Testing map drawing submission...');

      // Test the fixed map drawing logic
      const mapDrawingData = {
        version: '1.0',
        canvasData: {},
        metadata: {
          totalElements: 1,
          drawingDuration: 3000,
          canvasSize: { width: 800, height: 600 }
        }
      };

      // Insert map drawing (no bounds)
      const mapDrawingResult = await client.query(`
        INSERT INTO map_drawings (response_id, drawing_data, created_at)
        VALUES ($1, $2, NOW())
        RETURNING id
      `, [responseId, JSON.stringify(mapDrawingData)]);

      const mapDrawingId = mapDrawingResult.rows[0].id;
      console.log('✓ Created map drawing:', mapDrawingId);

      // Test drawing element insertion with PostGIS
      console.log('\n5. Testing drawing element insertion...');
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
        JSON.stringify({ label: 'Fixed API Test Polygon', createdWith: 'Fixed API Logic' })
      ]);

      console.log('✓ Created drawing element:', elementResult.rows[0].id);
    }

    // Step 5: Complete the participant session
    console.log('\n6. Completing participant session...');
    await client.query(`
      UPDATE participants 
      SET completed_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [participantId]);
    console.log('✓ Participant session completed');

    // Step 6: Verify the complete flow
    console.log('\n7. Verifying complete flow...');
    const verificationResult = await client.query(`
      SELECT 
        p.id as participant_id,
        p.completed_at,
        r.id as response_id,
        r.response_data,
        md.id as map_drawing_id,
        COUNT(de.id) as element_count
      FROM participants p
      LEFT JOIN responses r ON p.id = r.participant_id
      LEFT JOIN map_drawings md ON r.id = md.response_id
      LEFT JOIN drawing_elements de ON md.id = de.map_drawing_id
      WHERE p.id = $1
      GROUP BY p.id, r.id, md.id
    `, [participantId]);

    if (verificationResult.rows.length > 0) {
      const result = verificationResult.rows[0];
      console.log('✓ Complete flow verified:');
      console.log('  Participant completed:', result.completed_at ? 'Yes' : 'No');
      console.log('  Response created:', result.response_id ? 'Yes' : 'No');
      console.log('  Map drawing created:', result.map_drawing_id ? 'Yes' : 'No');
      console.log('  Drawing elements:', result.element_count || 0);
    }

    client.release();
    console.log('\n✅ Fixed API logic test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testFixedAPI();