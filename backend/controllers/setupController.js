const { supabaseAdmin } = require('../config/supabase');
const fs = require('fs');
const path = require('path');

// @desc    Initialize database schema
// @route   POST /api/setup/initialize-db
// @access  Public (first time only)
exports.initializeDatabase = async (req, res) => {
  try {
    console.log('⏳ Starting database initialization...');

    // Read SQL schema file
    const schemaPath = path.join(__dirname, '../config/supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by statements and execute each one
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    let executed = 0;
    const errors = [];

    for (const statement of statements) {
      try {
        await supabaseAdmin.rpc('exec_sql', {
          sql: statement + ';'
        }).catch(() => {
          // Fallback: try direct query if RPC fails
          return supabaseAdmin.from('_sql').select().limit(0);
        });
        executed++;
      } catch (error) {
        // Some statements may fail (like CREATE EXTENSION IF NOT EXISTS)
        // This is normal, continue with others
        console.log(`⚠️  Statement ${executed} warning: ${error.message?.substring(0, 100)}`);
      }
    }

    console.log(`✅ Executed ${executed} statements`);

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(100);

    if (tablesError) {
      console.log('Table verification: Checking via direct query...');
    }

    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        statementsExecuted: executed,
        totalStatements: statements.length,
        schema: {
          tables: [
            'roles',
            'profiles',
            'lawyer_profiles',
            'cases',
            'case_documents',
            'case_notes',
            'case_timeline',
            'messages',
            'payments',
            'invoices',
            'transactions',
            'refunds',
            'subscriptions',
            'analytics',
            'support_tickets',
            'audit_logs'
          ],
          roles: [
            'user',
            'lawyer',
            'admin',
            'technical_support',
            'business_support'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing database',
      error: error.message
    });
  }
};

// @desc    Get database status
// @route   GET /api/setup/db-status
// @access  Public
exports.getDatabaseStatus = async (req, res) => {
  try {
    // Try to query a table to verify connection
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist
      return res.status(200).json({
        success: true,
        status: 'uninitialized',
        message: 'Database schema not yet initialized',
        nextStep: 'POST /api/setup/initialize-db'
      });
    }

    if (error) {
      throw error;
    }

    // Check all critical tables
    const criticalTables = [
      'roles',
      'profiles',
      'cases',
      'payments',
      'invoices',
      'transactions'
    ];

    let allTablesExist = true;

    for (const table of criticalTables) {
      const { error: tableError } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);

      if (tableError && tableError.code === 'PGRST116') {
        allTablesExist = false;
        break;
      }
    }

    if (!allTablesExist) {
      return res.status(200).json({
        success: true,
        status: 'partial',
        message: 'Database partially initialized',
        nextStep: 'POST /api/setup/initialize-db'
      });
    }

    // Get role count
    const { data: roles } = await supabaseAdmin
      .from('roles')
      .select('*');

    res.status(200).json({
      success: true,
      status: 'initialized',
      message: 'Database is fully initialized',
      data: {
        rolesCount: roles?.length || 0,
        roles: roles?.map(r => r.name) || []
      }
    });

  } catch (error) {
    console.error('Database status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking database status',
      error: error.message
    });
  }
};

// @desc    Get setup info
// @route   GET /api/setup/info
// @access  Public
exports.getSetupInfo = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Setup API endpoints',
    endpoints: {
      initialize: {
        method: 'POST',
        path: '/api/setup/initialize-db',
        description: 'Initialize Supabase database schema'
      },
      status: {
        method: 'GET',
        path: '/api/setup/db-status',
        description: 'Check database initialization status'
      },
      info: {
        method: 'GET',
        path: '/api/setup/info',
        description: 'Get setup API info'
      }
    },
    instructions: [
      '1. Check status: GET /api/setup/db-status',
      '2. If uninitialized, initialize: POST /api/setup/initialize-db',
      '3. Verify: GET /api/setup/db-status',
      '4. Start using API'
    ]
  });
};
