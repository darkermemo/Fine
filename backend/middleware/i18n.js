const ar = require('../locales/ar');
const en = require('../locales/en');

// Get translation by key
const translate = (key, lang = 'en') => {
  const translations = lang === 'ar' ? ar : en;
  
  // Split key by dots to access nested properties
  const keys = key.split('.');
  let translation = translations;
  
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k];
    } else {
      // Fallback to English if key not found in requested language
      if (lang !== 'en') {
        return translate(key, 'en');
      }
      return key; // Return key if not found in English
    }
  }
  
  return translation;
};

// Express middleware to detect language and add translation helpers
const i18nMiddleware = (req, res, next) => {
  // Detect language from Accept-Language header or query parameter
  const lang = req.query.lang || 
               (req.headers['accept-language'] && req.headers['accept-language'].includes('ar') ? 'ar' : 'en') ||
               'en';
  
  // Add translation function to request
  req.t = (key) => translate(key, lang);
  
  // Add translation helpers to response
  res.success = (data, messageKey = 'success.retrieved', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message: translate(messageKey, lang),
      data,
      lang
    });
  };
  
  res.error = (messageKey = 'errors.serverError', statusCode = 500, error = null) => {
    res.status(statusCode).json({
      success: false,
      message: translate(messageKey, lang),
      error: process.env.NODE_ENV === 'development' ? error : undefined,
      lang
    });
  };
  
  // Add translation helpers for specific data types
  req.translateCaseStatus = (status) => translate(`caseStatus.${status}`, lang);
  req.translateViolationType = (type) => translate(`violationTypes.${type}`, lang);
  req.translateCity = (city) => translate(`cities.${city}`, lang);
  
  next();
};

// Helper functions for formatting
const formatCurrencySAR = (amount) => {
  const formatted = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0
  }).format(amount);
  
  return formatted.replace('ر.س', 'ر.س');
};

const formatDateArabic = (date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const formatTimeArabic = (date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

module.exports = {
  i18nMiddleware,
  translate,
  formatCurrencySAR,
  formatDateArabic,
  formatTimeArabic
};
