import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'mental_maps_dev',
});

async function quickView() {
  try {
    const client = await pool.connect();
    await client.query('SET search_path TO mental_maps, public');
    
    console.log('=== MENTAL MAPS DATABASE OVERVIEW ===\n');
    
    // Studies
    const studies = await client.query(`
      SELECT id, title, active, created_at, 
             (SELECT COUNT(*) FROM questions WHERE study_id = studies.id) as question_count,
             (SELECT COUNT(*) FROM participants WHERE study_id = studies.id) as participant_count
      FROM studies 
      ORDER BY created_at DESC
    `);
    
    console.log('📚 STUDIES:');
    studies.rows.forEach(study => {
      console.log(`  ${study.active ? '🟢' : '🔴'} ${study.title}`);
      console.log(`     ID: ${study.id}`);
      console.log(`     Questions: ${study.question_count}, Participants: ${study.participant_count}`);
      console.log(`     Created: ${study.created_at}\n`);
    });
    
    // Questions for each study
    console.log('❓ QUESTIONS BY STUDY:');
    for (const study of studies.rows) {
      const questions = await client.query(`
        SELECT id, question_text, question_type, order_index
        FROM questions 
        WHERE study_id = $1 
        ORDER BY order_index
      `, [study.id]);
      
      if (questions.rows.length > 0) {
        console.log(`  📖 ${study.title}:`);
        questions.rows.forEach(q => {
          console.log(`     ${q.order_index + 1}. ${q.question_text.substring(0, 60)}...`);
          console.log(`        Type: ${q.question_type}, ID: ${q.id.substring(0, 8)}...`);
        });
        console.log('');
      }
    }
    
    // Recent responses
    const responses = await client.query(`
      SELECT r.id, r.participant_id, r.question_id, r.created_at,
             q.question_text, s.title as study_title
      FROM responses r
      JOIN questions q ON r.question_id = q.id
      JOIN studies s ON q.study_id = s.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    
    console.log('💬 RECENT RESPONSES:');
    responses.rows.forEach(r => {
      console.log(`  📝 ${r.study_title}`);
      console.log(`     Question: ${r.question_text.substring(0, 50)}...`);
      console.log(`     Participant: ${r.participant_id.substring(0, 8)}...`);
      console.log(`     Time: ${r.created_at}\n`);
    });
    
    // Participants
    const participants = await client.query(`
      SELECT p.id, p.study_id, p.started_at, p.completed_at, s.title as study_title,
             (SELECT COUNT(*) FROM responses r JOIN questions q ON r.question_id = q.id WHERE q.study_id = p.study_id AND r.participant_id = p.id) as response_count
      FROM participants p
      JOIN studies s ON p.study_id = s.id
      ORDER BY p.started_at DESC
      LIMIT 10
    `);
    
    console.log('👥 RECENT PARTICIPANTS:');
    participants.rows.forEach(p => {
      const status = p.completed_at ? '✅ Completed' : '⏳ In Progress';
      console.log(`  ${status} - ${p.study_title}`);
      console.log(`     ID: ${p.id.substring(0, 8)}...`);
      console.log(`     Responses: ${p.response_count}`);
      console.log(`     Started: ${p.started_at}`);
      if (p.completed_at) console.log(`     Completed: ${p.completed_at}`);
      console.log('');
    });
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

quickView();