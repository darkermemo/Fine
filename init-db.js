const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:12345Qwert@db.hzulecfeysuxatmmyxzc.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('📖 Reading schema file...');
    const schemaPath = path.join(__dirname, 'backend/config/supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Executing schema...');
    await client.query(schema);
    
    console.log('\n✅ SUCCESS! Database schema executed.');
    
    // Verify tables
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Created ${rows.length} tables:`);
    rows.forEach(r => console.log(`   ✓ ${r.table_name}`));
    
    // Verify roles
    const { rows: roles } = await client.query('SELECT name FROM roles');
    console.log(`\n👥 Created ${roles.length} roles:`);
    roles.forEach(r => console.log(`   ✓ ${r.name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
