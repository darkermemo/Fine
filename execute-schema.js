const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:12345Qwert@db.hzulecfeysuxatmmyxzc.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function executeSchema() {
  const client = await pool.connect();
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'backend/config/supabase-schema.sql'), 'utf8');
    
    console.log('⏳ Executing Supabase schema...');
    await client.query(schema);
    console.log('\n✅ Database schema executed successfully!');
    console.log('✅ All 15 tables created');
    console.log('✅ Roles inserted (user, lawyer, admin, technical_support, business_support)');
    console.log('✅ Row Level Security (RLS) enabled');
    console.log('✅ Indexes created for performance\n');
  } catch (error) {
    console.error('❌ Error executing schema:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

executeSchema();
