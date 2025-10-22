const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://hzulecfeysuxatmmyxzc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use this for server-side operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client for authenticated requests (use this for most operations)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase admin client for server-side operations (user creation, RLS bypass, etc)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey
};
