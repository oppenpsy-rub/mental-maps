const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateUsersTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [process.env.DB_NAME]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);

    // Add missing columns
    if (!existingColumns.includes('institution')) {
      await connection.execute('ALTER TABLE users ADD COLUMN institution VARCHAR(255)');
      console.log('Added institution column');
    }

    if (!existingColumns.includes('department')) {
      await connection.execute('ALTER TABLE users ADD COLUMN department VARCHAR(255)');
      console.log('Added department column');
    }

    if (!existingColumns.includes('language')) {
      await connection.execute("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'de'");
      console.log('Added language column');
    }

    if (!existingColumns.includes('updated_at')) {
      await connection.execute('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      console.log('Added updated_at column');
    }

    // Show final table structure
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.log('\nFinal table structure:');
    finalColumns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE}, default: ${col.COLUMN_DEFAULT})`);
    });

    await connection.end();
    console.log('\nDatabase update completed successfully!');
  } catch (error) {
    console.error('Error updating users table:', error);
    process.exit(1);
  }
}

updateUsersTable();