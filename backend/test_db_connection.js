import { AppDataSource } from './src/database/connection.ts';

async function testDatabaseConnection() {
  console.log('=== TESTING DATABASE CONNECTION ===\n');

  try {
    console.log('1. Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✓ Database connection initialized');

    console.log('\n2. Testing basic query...');
    const result = await AppDataSource.query('SELECT NOW() as current_time');
    console.log('✓ Basic query successful:', result[0]);

    console.log('\n3. Testing studies table...');
    const studies = await AppDataSource.query(`
      SELECT id, title, active, created_at 
      FROM mental_maps.studies 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log(`✓ Found ${studies.length} studies`);
    studies.forEach(study => {
      console.log(`  - ${study.title} (${study.active ? 'Active' : 'Inactive'})`);
    });

    console.log('\n4. Testing questions table...');
    const questions = await AppDataSource.query(`
      SELECT q.id, q.question_text, q.question_type, s.title as study_title
      FROM mental_maps.questions q
      JOIN mental_maps.studies s ON q.study_id = s.id
      ORDER BY s.title, q.order_index
      LIMIT 5
    `);
    console.log(`✓ Found ${questions.length} questions`);
    questions.forEach(q => {
      console.log(`  - ${q.study_title}: ${q.question_text.substring(0, 50)}...`);
    });

    console.log('\n5. Testing specific study lookup...');
    const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
    const specificStudy = await AppDataSource.query(`
      SELECT id, title, active, settings
      FROM mental_maps.studies 
      WHERE id = $1
    `, [studyId]);
    
    if (specificStudy.length > 0) {
      console.log('✓ Found specific study:', specificStudy[0].title);
      console.log('  Settings:', specificStudy[0].settings);
    } else {
      console.log('❌ Specific study not found');
    }

    console.log('\n6. Testing questions for specific study...');
    const studyQuestions = await AppDataSource.query(`
      SELECT id, question_text, question_type, order_index, configuration
      FROM mental_maps.questions 
      WHERE study_id = $1
      ORDER BY order_index
    `, [studyId]);
    
    console.log(`✓ Found ${studyQuestions.length} questions for study`);
    studyQuestions.forEach(q => {
      console.log(`  - ${q.order_index}: ${q.question_text} (${q.question_type})`);
    });

    await AppDataSource.destroy();
    console.log('\n✓ Database connection closed successfully');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDatabaseConnection();