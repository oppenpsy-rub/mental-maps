const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'mentalmap_user',
      password: 'your_secure_password',
      database: 'mentalmap'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    // Insert test user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Test User', 'test@example.com', hashedPassword, 'researcher']
    );

    console.log('✅ Test-Benutzer erfolgreich erstellt!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Passwort: test123');
    console.log('🆔 Benutzer-ID:', result.insertId);

    await pool.end();
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('ℹ️  Test-Benutzer existiert bereits');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Passwort: test123');
    } else {
      console.error('❌ Fehler beim Erstellen des Test-Benutzers:', error.message);
    }
  }
}

createTestUser();