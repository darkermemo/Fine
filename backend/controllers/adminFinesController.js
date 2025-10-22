const { supabaseAdmin } = require('../config/supabase');

// ═══════════════════════════════════════════════════════════════════════════════
// FINE TYPE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get all fine types
// @route   GET /api/admin/fine-types
// @access  Private (Admin only)
exports.getFineTypes = async (req, res) => {
  try {
    const { data: fineTypes, error } = await supabaseAdmin
      .from('fine_types')
      .select('*, fee_structures(*), fine_violations(*)')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: fineTypes
    });
  } catch (error) {
    console.error('Error fetching fine types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fine types',
      error: error.message
    });
  }
};

// @desc    Create new fine type
// @route   POST /api/admin/fine-types
// @access  Private (Admin only)
exports.createFineType = async (req, res) => {
  try {
    const { name, description, category, iconUrl } = req.body;
    const adminId = req.user.profile.id;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    const { data: fineType, error: createError } = await supabaseAdmin
      .from('fine_types')
      .insert({
        name,
        description,
        category,
        icon_url: iconUrl,
        is_active: true
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log to audit
    await supabaseAdmin.from('settings_audit_log').insert({
      admin_id: adminId,
      action: 'CREATE',
      entity_type: 'fine_type',
      entity_id: fineType.id,
      new_values: fineType
    });

    res.status(201).json({
      success: true,
      message: 'Fine type created successfully',
      data: fineType
    });
  } catch (error) {
    console.error('Error creating fine type:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating fine type',
      error: error.message
    });
  }
};

// @desc    Update fine type
// @route   PUT /api/admin/fine-types/:id
// @access  Private (Admin only)
exports.updateFineType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, iconUrl, isActive } = req.body;
    const adminId = req.user.profile.id;

    // Get old values
    const { data: oldFineType } = await supabaseAdmin
      .from('fine_types')
      .select('*')
      .eq('id', id)
      .single();

    const { data: fineType, error: updateError } = await supabaseAdmin
      .from('fine_types')
      .update({
        name: name || oldFineType.name,
        description: description || oldFineType.description,
        category: category || oldFineType.category,
        icon_url: iconUrl || oldFineType.icon_url,
        is_active: isActive !== undefined ? isActive : oldFineType.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to audit
    await supabaseAdmin.from('settings_audit_log').insert({
      admin_id: adminId,
      action: 'UPDATE',
      entity_type: 'fine_type',
      entity_id: id,
      old_values: oldFineType,
      new_values: fineType
    });

    res.status(200).json({
      success: true,
      message: 'Fine type updated successfully',
      data: fineType
    });
  } catch (error) {
    console.error('Error updating fine type:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fine type',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FEE STRUCTURE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get fee structure for fine type
// @route   GET /api/admin/fee-structures/:fineTypeId
// @access  Private (Admin only)
exports.getFeeStructure = async (req, res) => {
  try {
    const { fineTypeId } = req.params;

    const { data: feeStructure, error } = await supabaseAdmin
      .from('fee_structures')
      .select('*')
      .eq('fine_type_id', fineTypeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.status(200).json({
      success: true,
      data: feeStructure
    });
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fee structure',
      error: error.message
    });
  }
};

// @desc    Create or update fee structure
// @route   POST /api/admin/fee-structures
// @access  Private (Admin only)
exports.setFeeStructure = async (req, res) => {
  try {
    const {
      fineTypeId,
      minFine,
      maxFine,
      adminFee,
      penaltyFeePercentage,
      latePaymentFee,
      platformCommissionPercentage,
      lawyerCommissionPercentage
    } = req.body;
    const adminId = req.user.profile.id;

    if (!fineTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Fine type ID is required'
      });
    }

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('fee_structures')
      .select('*')
      .eq('fine_type_id', fineTypeId)
      .single();

    let feeStructure, error;

    if (existing) {
      // Update
      ({ data: feeStructure, error } = await supabaseAdmin
        .from('fee_structures')
        .update({
          min_fine: minFine,
          max_fine: maxFine,
          admin_fee: adminFee,
          penalty_fee_percentage: penaltyFeePercentage,
          late_payment_fee: latePaymentFee,
          platform_commission_percentage: platformCommissionPercentage,
          lawyer_commission_percentage: lawyerCommissionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('fine_type_id', fineTypeId)
        .select()
        .single());

      // Log to audit
      await supabaseAdmin.from('settings_audit_log').insert({
        admin_id: adminId,
        action: 'UPDATE',
        entity_type: 'fee_structure',
        entity_id: existing.id,
        old_values: existing,
        new_values: feeStructure
      });
    } else {
      // Create
      ({ data: feeStructure, error } = await supabaseAdmin
        .from('fee_structures')
        .insert({
          fine_type_id: fineTypeId,
          min_fine: minFine,
          max_fine: maxFine,
          admin_fee: adminFee,
          penalty_fee_percentage: penaltyFeePercentage,
          late_payment_fee: latePaymentFee,
          platform_commission_percentage: platformCommissionPercentage,
          lawyer_commission_percentage: lawyerCommissionPercentage
        })
        .select()
        .single());

      // Log to audit
      await supabaseAdmin.from('settings_audit_log').insert({
        admin_id: adminId,
        action: 'CREATE',
        entity_type: 'fee_structure',
        entity_id: feeStructure.id,
        new_values: feeStructure
      });
    }

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: existing ? 'Fee structure updated' : 'Fee structure created',
      data: feeStructure
    });
  } catch (error) {
    console.error('Error setting fee structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting fee structure',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINE VIOLATIONS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get all violations for fine type
// @route   GET /api/admin/fine-violations/:fineTypeId
// @access  Private (Admin only)
exports.getViolations = async (req, res) => {
  try {
    const { fineTypeId } = req.params;

    const { data: violations, error } = await supabaseAdmin
      .from('fine_violations')
      .select('*')
      .eq('fine_type_id', fineTypeId)
      .eq('is_active', true)
      .order('severity_level');

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: violations
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching violations',
      error: error.message
    });
  }
};

// @desc    Create violation
// @route   POST /api/admin/fine-violations
// @access  Private (Admin only)
exports.createViolation = async (req, res) => {
  try {
    const { fineTypeId, violationName, violationCode, description, defaultFineAmount, severityLevel } = req.body;
    const adminId = req.user.profile.id;

    if (!fineTypeId || !violationName) {
      return res.status(400).json({
        success: false,
        message: 'Fine type ID and violation name are required'
      });
    }

    const { data: violation, error } = await supabaseAdmin
      .from('fine_violations')
      .insert({
        fine_type_id: fineTypeId,
        violation_name: violationName,
        violation_code: violationCode,
        description,
        default_fine_amount: defaultFineAmount,
        severity_level: severityLevel || 'moderate'
      })
      .select()
      .single();

    if (error) throw error;

    // Log to audit
    await supabaseAdmin.from('settings_audit_log').insert({
      admin_id: adminId,
      action: 'CREATE',
      entity_type: 'violation',
      entity_id: violation.id,
      new_values: violation
    });

    res.status(201).json({
      success: true,
      message: 'Violation created successfully',
      data: violation
    });
  } catch (error) {
    console.error('Error creating violation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating violation',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// @desc    Get all admin settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
exports.getSettings = async (req, res) => {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .eq('is_editable', true)
      .order('category');

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// @desc    Update admin setting
// @route   PUT /api/admin/settings/:settingKey
// @access  Private (Admin only)
exports.updateSetting = async (req, res) => {
  try {
    const { settingKey } = req.params;
    const { settingValue } = req.body;
    const adminId = req.user.profile.id;

    if (!settingValue) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    // Get old value
    const { data: oldSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .eq('setting_key', settingKey)
      .single();

    if (!oldSetting || !oldSetting.is_editable) {
      return res.status(403).json({
        success: false,
        message: 'This setting cannot be edited'
      });
    }

    const { data: setting, error } = await supabaseAdmin
      .from('admin_settings')
      .update({
        setting_value: settingValue,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', settingKey)
      .select()
      .single();

    if (error) throw error;

    // Log to audit
    await supabaseAdmin.from('settings_audit_log').insert({
      admin_id: adminId,
      action: 'UPDATE_SETTING',
      entity_type: 'setting',
      entity_id: setting.id,
      old_values: { value: oldSetting.setting_value },
      new_values: { value: settingValue }
    });

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating setting',
      error: error.message
    });
  }
};

// @desc    Get audit log
// @route   GET /api/admin/audit-log
// @access  Private (Admin only)
exports.getAuditLog = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data: auditLog, error } = await supabaseAdmin
      .from('settings_audit_log')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log',
      error: error.message
    });
  }
};
