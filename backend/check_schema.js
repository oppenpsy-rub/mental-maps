import { AppDataSource } from './src/database/connection.ts';

async function checkSchema() {
  try {
    await AppDataSource.initialize();
    console.log('=== Checking Database Schema ===');

    // Check participants table structure
    const participantsSchema = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'mental_maps' AND table_name = 'participants'
      ORDER BY ordinal_position
    `);
    console.log('\n=== Participants Table Structure ===');
    participantsSchema.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check responses table structure
    const responsesSchema = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'mental_maps' AND table_name = 'responses'
      ORDER BY ordinal_position
    `);
    console.log('\n=== Responses Table Structure ===');
    responsesSchema.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check map_drawings table structure
    const drawingsSchema = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'mental_maps' AND table_name = 'map_drawings'
      ORDER BY ordinal_position
    `);
    console.log('\n=== Map Drawings Table Structure ===');
    drawingsSchema.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check drawing_elements table structure
    const elementsSchema = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'mental_maps' AND table_name = 'drawing_elements'
      ORDER BY ordinal_position
    `);
    console.log('\n=== Drawing Elements Table Structure ===');
    elementsSchema.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();