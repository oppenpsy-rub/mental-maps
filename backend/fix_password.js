import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'mental_maps_dev',
});

async function fixPassword() {
  try {
    console.log('=== Fixing Password Hash ===');
    
    const client = await pool.connect();
    await client.query('SET search_path TO mental_maps, public');
    
    // Generate proper bcrypt hash for "password"
    const password = 'password';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Generated hash:', hashedPassword);
    
    // Update the user's password
    const result = await client.query(`
      UPDATE researchers 
      SET password_hash = $1 
      WHERE email = $2
      RETURNING id, email, name
    `, [hashedPassword, 'test@example.com']);
    
    if (result.rows.length > 0) {
      console.log('✓ Password updated successfully for:', result.rows[0].email);
      console.log('  User ID:', result.rows[0].id);
      console.log('  Name:', result.rows[0].name);
    } else {
      console.log('❌ No user found with email: test@example.com');
    }
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('✓ Hash verification:', isValid ? 'PASSED' : 'FAILED');
    
    client.release();
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixPassword();