const { supabaseAdmin } = require('../config/supabase');

// @desc    Get all fine categories (with display order)
// @route   GET /api/fines/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const { language = 'en' } = req.query; // 'en' or 'ar'

    const { data: categories, error } = await supabaseAdmin
      .from('fine_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    // Format response based on language
    const formatted = categories.map(cat => ({
      id: cat.id,
      name: language === 'ar' ? cat.name_ar : cat.name_en,
      description: language === 'ar' ? cat.description_ar : cat.description_en,
      icon: cat.icon_emoji,
      color: cat.color_code,
      isDefault: cat.is_default,
      order: cat.display_order
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fine categories',
      error: error.message
    });
  }
};

// @desc    Get subcategories for a category
// @route   GET /api/fines/categories/:categoryId/subcategories
// @access  Public
exports.getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { language = 'en' } = req.query;

    const { data: subcategories, error } = await supabaseAdmin
      .from('fine_subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    const formatted = subcategories.map(sub => ({
      id: sub.id,
      name: language === 'ar' ? sub.name_ar : sub.name_en,
      description: language === 'ar' ? sub.description_ar : sub.description_en,
      order: sub.display_order
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
};

// @desc    Get fine types for a subcategory
// @route   GET /api/fines/subcategories/:subcategoryId/types
// @access  Public
exports.getFineTypes = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { language = 'en' } = req.query;

    const { data: fineTypes, error } = await supabaseAdmin
      .from('fine_types')
      .select('*, fee_structures(*), fine_requirements(*), fine_resolutions(*)')
      .eq('subcategory_id', subcategoryId)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    const formatted = fineTypes.map(type => ({
      id: type.id,
      name: language === 'ar' ? type.name_ar : type.name,
      description: language === 'ar' ? type.description_ar : type.description,
      category: type.category,
      feeStructure: type.fee_structures?.[0],
      requirements: type.fine_requirements?.map(req => ({
        id: req.id,
        text: language === 'ar' ? req.requirement_ar : req.requirement_en,
        type: req.requirement_type,
        mandatory: req.is_mandatory
      })),
      resolutions: type.fine_resolutions?.map(res => ({
        id: res.id,
        method: language === 'ar' ? res.method_ar : res.method_en,
        description: language === 'ar' ? res.description_ar : res.description_en,
        timeline: res.typical_timeline_days
      }))
    }));

    res.status(200).json({
      success: true,
      data: formatted
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

// @desc    Smart search for fines by keyword
// @route   GET /api/fines/search
// @access  Public
exports.searchFines = async (req, res) => {
  try {
    const { query, language = 'en' } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    // Search in keywords first
    let { data: keywords, error: keywordError } = await supabaseAdmin
      .from('fine_search_keywords')
      .select('fine_type_id')
      .or(`keyword_en.ilike.%${query}%,keyword_ar.ilike.%${query}%`);

    if (keywordError) throw keywordError;

    const fineTypeIds = keywords.map(k => k.fine_type_id);

    // If no keywords found, search in names/descriptions
    if (fineTypeIds.length === 0) {
      const { data: types, error: typeError } = await supabaseAdmin
        .from('fine_types')
        .select('id')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,name_ar.ilike.%${query}%,description_ar.ilike.%${query}%`);

      if (typeError) throw typeError;
      fineTypeIds.push(...types.map(t => t.id));
    }

    // Get full fine type details
    const { data: fineTypes, error: detailError } = await supabaseAdmin
      .from('fine_types')
      .select('*, subcategories(*, categories(*)), fee_structures(*), fine_requirements(*), fine_resolutions(*)')
      .in('id', fineTypeIds)
      .limit(20);

    if (detailError) throw detailError;

    const formatted = fineTypes.map(type => ({
      id: type.id,
      name: language === 'ar' ? type.name_ar : type.name,
      description: language === 'ar' ? type.description_ar : type.description,
      category: language === 'ar' ? type.subcategories?.categories?.name_ar : type.subcategories?.categories?.name_en,
      subcategory: language === 'ar' ? type.subcategories?.name_ar : type.subcategories?.name_en,
      feeStructure: type.fee_structures?.[0],
      requirements: type.fine_requirements?.map(req => ({
        text: language === 'ar' ? req.requirement_ar : req.requirement_en,
        type: req.requirement_type,
        mandatory: req.is_mandatory
      }))
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error searching fines:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching fines',
      error: error.message
    });
  }
};

// @desc    Get fine details with all requirements and resolutions
// @route   GET /api/fines/:fineTypeId
// @access  Public
exports.getFineDetail = async (req, res) => {
  try {
    const { fineTypeId } = req.params;
    const { language = 'en' } = req.query;

    const { data: fineType, error } = await supabaseAdmin
      .from('fine_types')
      .select('*, subcategories(*, categories(*)), fee_structures(*), fine_requirements(*), fine_resolutions(*)')
      .eq('id', fineTypeId)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Fine type not found'
      });
    }

    if (error) throw error;

    const formatted = {
      id: fineType.id,
      name: language === 'ar' ? fineType.name_ar : fineType.name,
      description: language === 'ar' ? fineType.description_ar : fineType.description,
      category: {
        id: fineType.subcategories?.categories?.id,
        name: language === 'ar' ? fineType.subcategories?.categories?.name_ar : fineType.subcategories?.categories?.name_en,
        icon: fineType.subcategories?.categories?.icon_emoji,
        color: fineType.subcategories?.categories?.color_code
      },
      subcategory: {
        id: fineType.subcategories?.id,
        name: language === 'ar' ? fineType.subcategories?.name_ar : fineType.subcategories?.name_en
      },
      feeStructure: fineType.fee_structures?.[0],
      requirements: fineType.fine_requirements?.map(req => ({
        id: req.id,
        text: language === 'ar' ? req.requirement_ar : req.requirement_en,
        type: req.requirement_type,
        mandatory: req.is_mandatory
      })),
      resolutions: fineType.fine_resolutions?.map(res => ({
        id: res.id,
        method: language === 'ar' ? res.method_ar : res.method_en,
        description: language === 'ar' ? res.description_ar : res.description_en,
        timeline: res.typical_timeline_days
      }))
    };

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching fine details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fine details',
      error: error.message
    });
  }
};

// @desc    Get all categories with their full hierarchy (for UI)
// @route   GET /api/fines/browse/all
// @access  Public
exports.getBrowseHierarchy = async (req, res) => {
  try {
    const { language = 'en' } = req.query;

    // Get categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('fine_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (catError) throw catError;

    // Get subcategories for each category
    const { data: subcategories, error: subError } = await supabaseAdmin
      .from('fine_subcategories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (subError) throw subError;

    // Format response
    const formatted = categories.map(cat => ({
      id: cat.id,
      name: language === 'ar' ? cat.name_ar : cat.name_en,
      description: language === 'ar' ? cat.description_ar : cat.description_en,
      icon: cat.icon_emoji,
      color: cat.color_code,
      isDefault: cat.is_default,
      subcategories: subcategories
        .filter(sub => sub.category_id === cat.id)
        .map(sub => ({
          id: sub.id,
          name: language === 'ar' ? sub.name_ar : sub.name_en,
          description: language === 'ar' ? sub.description_ar : sub.description_en,
          fineCount: 0, // Will be counted separately
          fineTypes: []
        }))
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching browse hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching browse hierarchy',
      error: error.message
    });
  }
};
