import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'mental_maps_dev',
});

async function checkDatabase() {
  try {
    console.log('=== Checking Database Connection ===');
    
    // Test connection
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    
    // Check if schema exists
    const schemaResult = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name = 'mental_maps'
    `);
    console.log('✓ Schema exists:', schemaResult.rows.length > 0);
    
    // Set search path
    await client.query('SET search_path TO mental_maps, public');
    
    // Check tables
    console.log('\n=== Tables in mental_maps schema ===');
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'mental_maps'
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach(row => {
      console.log('- ' + row.table_name);
    });
    
    // Check researchers
    console.log('\n=== Researchers ===');
    const researchersResult = await client.query('SELECT id, email, name, password_hash FROM researchers');
    console.log('Total researchers:', researchersResult.rows.length);
    researchersResult.rows.forEach(row => {
      console.log(`- ${row.name} (${row.email}) - ID: ${row.id}`);
      console.log(`  Password hash: ${row.password_hash.substring(0, 20)}...`);
    });
    
    // Check studies
    console.log('\n=== Studies ===');
    const studiesResult = await client.query('SELECT id, title, researcher_id, active FROM studies');
    console.log('Total studies:', studiesResult.rows.length);
    studiesResult.rows.forEach(row => {
      console.log(`- ${row.title} (Active: ${row.active}) - ID: ${row.id}`);
    });
    
    // Check questions
    console.log('\n=== Questions ===');
    const questionsResult = await client.query(`
      SELECT q.id, q.study_id, q.question_text, q.question_type, q.order_index, s.title as study_title
      FROM questions q
      LEFT JOIN studies s ON q.study_id = s.id
      ORDER BY s.title, q.order_index
    `);
    console.log('Total questions:', questionsResult.rows.length);
    questionsResult.rows.forEach(row => {
      console.log(`- Study: ${row.study_title || 'Unknown'}`);
      console.log(`  Question ${row.order_index}: ${row.question_text.substring(0, 100)}...`);
      console.log(`  Type: ${row.question_type}, ID: ${row.id}`);
    });
    
    // Update existing user password for testing
    console.log('\n=== Updating user password for API testing ===');
    try {
      // Simple hash for testing - in production this should use bcrypt
      const simpleHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG.JOOdS8u'; // 'password'
      
      await client.query(`
        UPDATE researchers 
        SET password_hash = $1 
        WHERE email = $2
      `, [simpleHash, 'test@example.com']);
      
      console.log('✓ Updated password for test@example.com to "password"');
    } catch (userError) {
      console.error('Failed to update user password:', userError.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();