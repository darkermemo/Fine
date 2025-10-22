const express = require('express');
const router = express.Router();
const {
  getCategories,
  getSubcategories,
  getFineTypes,
  searchFines,
  getFineDetail,
  getBrowseHierarchy
} = require('../controllers/finesBrowseController');

// Get all categories with icons and colors
router.get('/categories', getCategories);

// Get subcategories for a specific category
router.get('/categories/:categoryId/subcategories', getSubcategories);

// Get fine types for a specific subcategory
router.get('/subcategories/:subcategoryId/types', getFineTypes);

// Get full hierarchy (categories → subcategories → fine types)
router.get('/browse/all', getBrowseHierarchy);

// Smart search fines by keyword (supports Arabic/English)
router.get('/search', searchFines);

// Get specific fine type with all details
router.get('/:fineTypeId', getFineDetail);

module.exports = router;
