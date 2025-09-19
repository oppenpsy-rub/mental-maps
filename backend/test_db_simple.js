import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'mental_maps_dev',
});

async function testDatabase() {
  console.log('=== TESTING DATABASE DIRECTLY ===\n');

  try {
    const client = await pool.connect();
    await client.query('SET search_path TO mental_maps, public');

    console.log('1. Testing study lookup...');
    const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
    const studyResult = await client.query(`
      SELECT id, title, active, settings, created_at
      FROM studies 
      WHERE id = $1
    `, [studyId]);

    if (studyResult.rows.length > 0) {
      const study = studyResult.rows[0];
      console.log('✓ Study found:', study.title);
      console.log('  Active:', study.active);
      console.log('  Settings:', study.settings);
    } else {
      console.log('❌ Study not found');
      client.release();
      return;
    }

    console.log('\n2. Testing questions for study...');
    const questionsResult = await client.query(`
      SELECT id, question_text, question_type, order_index, configuration
      FROM questions 
      WHERE study_id = $1
      ORDER BY order_index
    `, [studyId]);

    console.log(`✓ Found ${questionsResult.rows.length} questions`);
    questionsResult.rows.forEach(q => {
      console.log(`  - ${q.order_index}: ${q.question_text.substring(0, 50)}... (${q.question_type})`);
      console.log(`    ID: ${q.id}`);
      console.log(`    Config: ${JSON.stringify(q.configuration)}`);
    });

    console.log('\n3. Testing participants table...');
    const participantsResult = await client.query(`
      SELECT COUNT(*) as count, 
             COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_count
      FROM participants 
      WHERE study_id = $1
    `, [studyId]);

    const stats = participantsResult.rows[0];
    console.log(`✓ Participants: ${stats.count} total, ${stats.completed_count} completed`);

    console.log('\n4. Testing responses table...');
    const responsesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM responses r
      JOIN questions q ON r.question_id = q.id
      WHERE q.study_id = $1
    `, [studyId]);

    console.log(`✓ Responses: ${responsesResult.rows[0].count}`);

    console.log('\n5. Testing recent participants...');
    const recentParticipants = await client.query(`
      SELECT id, session_token, started_at, completed_at, consent_given
      FROM participants 
      WHERE study_id = $1
      ORDER BY started_at DESC
      LIMIT 3
    `, [studyId]);

    console.log(`✓ Recent participants:`);
    recentParticipants.rows.forEach(p => {
      console.log(`  - ${p.id.substring(0, 8)}... (${p.completed_at ? 'Completed' : 'In Progress'})`);
      console.log(`    Token: ${p.session_token ? p.session_token.substring(0, 20) + '...' : 'None'}`);
      console.log(`    Consent: ${p.consent_given}`);
    });

    client.release();
    console.log('\n✓ Database test completed successfully');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testDatabase();