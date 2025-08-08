/*
File: src/constants/dataStandards.js
Data standards constants for backend validation pipeline
- Platform types and validation constants
- Quality thresholds and metrics
- Validation configuration
*/
'use strict';

/**
 * Platform Types for event processing
 */
const PLATFORM_TYPES = {
  HTML: 'html',
  WEB: 'web',
  WORDPRESS: 'wordpress',
  SHOPIFY: 'shopify',
  WOOCOMMERCE: 'woocommerce',
  MOBILE: 'mobile',
  API: 'api'
};

/**
 * Quality thresholds for validation pipeline
 */
const QUALITY_THRESHOLDS = {
  // Quality scores (0-100)
  EXCELLENT: 90,
  GOOD: 80,
  ACCEPTABLE: 70,
  POOR: 50,
  CRITICAL: 30,
  
  // Data completeness thresholds
  COMPLETENESS: {
    EXCELLENT: 95,
    GOOD: 85,
    ACCEPTABLE: 75,
    POOR: 60
  },
  
  // Facebook CAPI readiness thresholds  
  FACEBOOK_CAPI: {
    EXCELLENT: 95,
    GOOD: 85,
    ACCEPTABLE: 70,
    POOR: 50
  },
  
  // Privacy compliance thresholds
  PRIVACY: {
    EXCELLENT: 95,
    GOOD: 85,
    ACCEPTABLE: 75,
    POOR: 60
  },
  
  // Performance thresholds (milliseconds)
  PERFORMANCE: {
    PROCESSING_TIME: {
      EXCELLENT: 100,
      GOOD: 200,
      ACCEPTABLE: 300,
      POOR: 500
    },
    VALIDATION_TIME: {
      EXCELLENT: 25,
      GOOD: 50,
      ACCEPTABLE: 100,
      POOR: 200
    }
  }
};

/**
 * Data priority system for merging data from different sources
 */
const DATA_PRIORITY = {
  MANUAL_MAPPING: 100,    // User-defined selectors (highest priority)
  PLATFORM_DATA: 50,      // WordPress/Shopify automatic data  
  FALLBACK_DATA: 10       // Basic HTML fallback data
};

/**
 * Standard data types for validation
 */
const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number', 
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  DATE: 'date',
  EMAIL: 'email',
  URL: 'url',
  CURRENCY: 'currency',
  PHONE: 'phone',
  HASH: 'hash'
};

/**
 * Currency codes (ISO 4217)
 */
const CURRENCY_CODES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'VND',
  'AUD', 'CAD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN',
  'CZK', 'HUF', 'RUB', 'BRL', 'MXN', 'INR', 'SGD',
  'HKD', 'NZD', 'ZAR', 'TRY', 'THB', 'MYR', 'IDR'
];

/**
 * Content types for Facebook CAPI
 */
const CONTENT_TYPES = {
  PRODUCT: 'product',
  PRODUCT_GROUP: 'product_group',
  HOTEL: 'hotel',
  FLIGHT: 'flight',
  DESTINATION: 'destination',
  HOME_LISTING: 'home_listing',
  VEHICLE: 'vehicle',
  GENERIC: 'generic'
};

/**
 * Validation modes
 */
const VALIDATION_MODES = {
  STRICT: 'strict',      // Strict validation - reject on any error
  SOFT: 'soft',          // Soft validation - accept with warnings
  PERMISSIVE: 'permissive' // Permissive - minimal validation
};

/**
 * PII (Personally Identifiable Information) field patterns
 */
const PII_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  SSN: /^\d{3}-?\d{2}-?\d{4}$/,
  CREDIT_CARD: /^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  HASH_SHA256: /^[a-f0-9]{64}$/i
};

/**
 * Standard event property requirements
 */
const PROPERTY_REQUIREMENTS = {
  PAGE_VIEW: ['page_url', 'page_title'],
  VIEW_CONTENT: ['content_ids', 'content_type'],
  ADD_TO_CART: ['content_ids', 'content_type', 'value', 'currency'],
  PURCHASE: ['content_ids', 'content_type', 'value', 'currency'],
  LEAD: [],
  COMPLETE_REGISTRATION: [],
  INITIATE_CHECKOUT: ['content_ids', 'value', 'currency'],
  ADD_PAYMENT_INFO: ['content_ids', 'value', 'currency'],
  SEARCH: ['search_string']
};

/**
 * Facebook CAPI parameter mapping
 */
const FACEBOOK_CAPI_PARAMETERS = {
  // Standard parameters
  STANDARD: [
    'event_name', 'event_time', 'event_id', 'event_source_url',
    'user_data', 'custom_data', 'data_processing_options'
  ],
  
  // User data parameters
  USER_DATA: [
    'email', 'phone', 'first_name', 'last_name', 'date_of_birth',
    'city', 'state', 'country', 'zip_code', 'gender', 'external_id'
  ],
  
  // Custom data parameters
  CUSTOM_DATA: [
    'value', 'currency', 'content_name', 'content_category',
    'content_ids', 'content_type', 'contents', 'num_items',
    'order_id', 'search_string', 'status'
  ]
};

/**
 * Data validation rules
 */
const VALIDATION_RULES = {
  // String length limits
  STRING_LIMITS: {
    EVENT_NAME: { min: 1, max: 100 },
    PAGE_URL: { min: 10, max: 2048 },
    PAGE_TITLE: { min: 1, max: 200 },
    PRODUCT_NAME: { min: 1, max: 200 },
    SEARCH_STRING: { min: 1, max: 100 },
    ORDER_ID: { min: 1, max: 50 }
  },
  
  // Numeric limits
  NUMERIC_LIMITS: {
    VALUE: { min: 0, max: 999999999 },
    QUANTITY: { min: 1, max: 10000 },
    PRICE: { min: 0, max: 999999999 }
  },
  
  // Array limits
  ARRAY_LIMITS: {
    CONTENT_IDS: { min: 1, max: 100 },
    TAGS: { min: 0, max: 50 }
  }
};

/**
 * Error codes for validation
 */
const ERROR_CODES = {
  // Structure errors
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_TYPE: 'INVALID_FIELD_TYPE',
  INVALID_FIELD_FORMAT: 'INVALID_FIELD_FORMAT',
  
  // Business rule errors
  INVALID_EVENT_NAME: 'INVALID_EVENT_NAME',
  MISSING_ECOMMERCE_DATA: 'MISSING_ECOMMERCE_DATA',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  INVALID_VALUE: 'INVALID_VALUE',
  
  // Privacy errors
  UNHASHED_PII: 'UNHASHED_PII',
  MISSING_CONSENT: 'MISSING_CONSENT',
  POTENTIAL_PII_LEAK: 'POTENTIAL_PII_LEAK',
  
  // Facebook CAPI errors
  MISSING_CAPI_PARAMS: 'MISSING_CAPI_PARAMS',
  INVALID_CAPI_FORMAT: 'INVALID_CAPI_FORMAT',
  MISSING_USER_DATA: 'MISSING_USER_DATA'
};

module.exports = {
  PLATFORM_TYPES,
  QUALITY_THRESHOLDS,
  DATA_PRIORITY,
  DATA_TYPES,
  CURRENCY_CODES,
  CONTENT_TYPES,
  VALIDATION_MODES,
  PII_PATTERNS,
  PROPERTY_REQUIREMENTS,
  FACEBOOK_CAPI_PARAMETERS,
  VALIDATION_RULES,
  ERROR_CODES
};