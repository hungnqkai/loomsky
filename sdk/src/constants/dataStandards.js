/*
File: sdk/src/constants/dataStandards.js
- loomskyDataLayer schema definitions
- Platform-specific data templates
- Data processing và validation standards
*/

/**
 * Platform Types
 */
export const PLATFORM_TYPES = {
  HTML: 'html',
  WORDPRESS: 'wordpress', 
  SHOPIFY: 'shopify',
  WOOCOMMERCE: 'woocommerce'
};

/**
 * Data Collection Priority System
 * Higher number = Higher priority
 */
export const DATA_PRIORITY = {
  MANUAL_MAPPING: 100,    // User-defined selectors (highest priority)
  PLATFORM_DATA: 50,      // WordPress/Shopify automatic data
  FALLBACK_DATA: 10       // Basic HTML fallback data
};

/**
 * Standard loomskyDataLayer Schema
 * Base structure that all platforms should follow
 */
export const BASE_DATA_LAYER_SCHEMA = {
  // Platform identification
  platform: {
    type: 'string',
    required: true,
    default: 'html',
    description: 'Platform type (html, wordpress, shopify)'
  },
  
  // Page context
  page_type: {
    type: 'string', 
    required: false,
    default: 'page',
    description: 'Type of current page (page, product, cart, checkout, thank_you)'
  },
  
  // User information
  user: {
    type: 'object',
    required: true,
    properties: {
      is_logged_in: { type: 'boolean', default: false },
      user_id: { type: 'string', default: null },
      email: { type: 'string', default: null, pii: true },
      role: { type: 'string', default: 'guest' }
    }
  },
  
  // E-commerce data (optional)
  ecommerce: {
    type: 'object',
    required: false,
    properties: {
      // Product data
      product_id: { type: 'string', facebook_param: 'content_id' },
      product_name: { type: 'string', facebook_param: 'content_name' },
      product_price: { type: 'number', facebook_param: 'value' },
      product_category: { type: 'string', facebook_param: 'content_category' },
      product_brand: { type: 'string', facebook_param: 'content_brand' },
      product_variant: { type: 'string', facebook_param: 'content_variant' },
      
      // Cart data
      cart_total: { type: 'number', facebook_param: 'value' },
      cart_items_count: { type: 'number', facebook_param: 'num_items' },
      
      // Transaction data
      order_id: { type: 'string', facebook_param: 'order_id' },
      currency: { type: 'string', facebook_param: 'currency', default: 'USD' },
      
      // Advanced data
      contents: { type: 'array', facebook_param: 'contents' },
      content_ids: { type: 'array', facebook_param: 'content_ids' }
    }
  }
};

/**
 * Platform-Specific Data Layer Templates
 */
export const PLATFORM_TEMPLATES = {
  /**
   * HTML Platform - Minimal data layer
   */
  [PLATFORM_TYPES.HTML]: {
    generateTemplate: () => ({
      platform: PLATFORM_TYPES.HTML,
      page_type: 'page',
      user: {
        is_logged_in: false,
        user_id: null,
        email: null,
        role: 'guest'
      }
      // No automatic ecommerce data - rely on manual mapping
    }),
    
    dataSources: [
      {
        name: 'Manual Data Mapping',
        priority: DATA_PRIORITY.MANUAL_MAPPING,
        description: 'User-defined CSS selectors to extract data from DOM'
      },
      {
        name: 'Basic HTML Detection', 
        priority: DATA_PRIORITY.FALLBACK_DATA,
        description: 'Fallback detection from meta tags and page structure'
      }
    ],
    
    requiredMappings: ['product_name', 'product_price'], // If e-commerce site
    recommendedMappings: ['user_email', 'cart_total', 'order_id']
  },

  /**
   * WordPress Platform - Rich data from WordPress/WooCommerce
   */
  [PLATFORM_TYPES.WORDPRESS]: {
    generateTemplate: (wpData = {}) => ({
      platform: PLATFORM_TYPES.WORDPRESS,
      page_type: wpData.page_type || 'page', // Auto-detect from WordPress
      user: {
        is_logged_in: wpData.user?.is_logged_in || false,
        user_id: wpData.user?.ID || null,
        email: wpData.user?.email || null, // From WordPress user
        role: wpData.user?.role || 'guest'
      },
      ecommerce: wpData.woocommerce ? {
        // WooCommerce automatic data
        product_id: wpData.woocommerce.product?.id || null,
        product_name: wpData.woocommerce.product?.name || null,
        product_price: wpData.woocommerce.product?.price || null,
        product_category: wpData.woocommerce.product?.category || null,
        cart_total: wpData.woocommerce.cart?.total || null,
        currency: wpData.woocommerce.currency || 'USD'
      } : {}
    }),
    
    dataSources: [
      {
        name: 'Manual Data Mapping',
        priority: DATA_PRIORITY.MANUAL_MAPPING,
        description: 'User overrides and custom field mappings'
      },
      {
        name: 'WordPress Data Layer',
        priority: DATA_PRIORITY.PLATFORM_DATA,
        description: 'Automatic data from WordPress and WooCommerce'
      },
      {
        name: 'HTML Fallback',
        priority: DATA_PRIORITY.FALLBACK_DATA,
        description: 'Fallback extraction from DOM when WordPress data unavailable'
      }
    ],
    
    automaticFields: ['user_id', 'user_email', 'is_logged_in', 'page_type'],
    woocommerceFields: ['product_id', 'product_name', 'product_price', 'cart_total']
  },

  /**
   * Shopify Platform - Rich data from Shopify Liquid
   */
  [PLATFORM_TYPES.SHOPIFY]: {
    generateTemplate: (shopifyData = {}) => ({
      platform: PLATFORM_TYPES.SHOPIFY,
      page_type: shopifyData.template?.name || 'page', // From Shopify template
      user: {
        is_logged_in: shopifyData.customer ? true : false,
        user_id: shopifyData.customer?.id || null,
        email: shopifyData.customer?.email || null,
        role: shopifyData.customer ? 'customer' : 'guest'
      },
      ecommerce: shopifyData.product || shopifyData.cart ? {
        // Shopify automatic data
        product_id: shopifyData.product?.id || null,
        product_name: shopifyData.product?.title || null,
        product_price: shopifyData.product?.price ? (shopifyData.product.price / 100) : null, // Convert from cents
        product_brand: shopifyData.product?.vendor || null,
        product_category: shopifyData.product?.type || null,
        cart_total: shopifyData.cart?.total_price ? (shopifyData.cart.total_price / 100) : null,
        cart_items_count: shopifyData.cart?.item_count || null,
        currency: shopifyData.cart?.currency || shopifyData.product?.currency || 'USD'
      } : {}
    }),
    
    dataSources: [
      {
        name: 'Manual Data Mapping',
        priority: DATA_PRIORITY.MANUAL_MAPPING,
        description: 'User overrides and custom field mappings'
      },
      {
        name: 'Shopify Liquid Data',
        priority: DATA_PRIORITY.PLATFORM_DATA,
        description: 'Automatic data from Shopify Liquid templates'
      },
      {
        name: 'HTML Fallback',
        priority: DATA_PRIORITY.FALLBACK_DATA,
        description: 'DOM extraction when Shopify data unavailable'
      }
    ],
    
    automaticFields: ['user_id', 'user_email', 'is_logged_in', 'page_type'],
    shopifyFields: ['product_id', 'product_title', 'product_price', 'product_vendor', 'cart_total']
  }
};

/**
 * Data Processing Rules
 */
export const DATA_PROCESSING_RULES = {
  /**
   * String processing rules
   */
  string: {
    clean: (value) => {
      if (!value) return null;
      const cleaned = value.toString().trim();
      
      // Remove HTML tags
      const withoutHTML = cleaned.replace(/<[^>]*>/g, '');
      
      // Validate length (prevent selector errors)
      if (withoutHTML.length > 1000) {
        console.warn('LoomSky: String too long, possible selector error');
        return withoutHTML.substring(0, 1000);
      }
      
      return withoutHTML === '' ? null : withoutHTML;
    }
  },

  /**
   * Number processing rules  
   */
  number: {
    clean: (value) => {
      if (!value) return null;
      
      // Remove currency symbols và formatting
      const cleaned = value.toString()
        .replace(/[^\d.-]/g, '') // Keep only digits, dots, dashes
        .replace(/,/g, ''); // Remove thousand separators
      
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }
  },

  /**
   * Email processing rules
   */
  email: {
    clean: (value) => {
      if (!value) return null;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleaned = value.toString().trim().toLowerCase();
      
      return emailRegex.test(cleaned) ? cleaned : null;
    }
  },

  /**
   * PII hashing for Facebook CAPI
   */
  pii: {
    hash: (value) => {
      if (!value) return null;
      
      const cleaned = value.toString().toLowerCase().trim();
      
      // Simple hash - in production, use SHA-256
      let hash = 0;
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(16);
    }
  }
};

/**
 * Data Merge Strategy
 * Defines how to merge data from multiple sources
 */
export const DATA_MERGE_STRATEGY = {
  /**
   * Merge data from multiple sources based on priority
   * @param {Array} dataSources - Array of {data, priority, source}
   * @returns {Object} - Merged data object
   */
  merge: (dataSources) => {
    // Sort by priority (highest first)
    const sorted = dataSources.sort((a, b) => b.priority - a.priority);
    
    const result = {};
    const sources = {};
    
    // Merge data, higher priority overwrites lower priority
    sorted.forEach(({ data, priority, source }) => {
      Object.keys(data || {}).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          // Only overwrite if current priority is higher or equal
          if (!result.hasOwnProperty(key) || priority >= (sources[key]?.priority || 0)) {
            result[key] = data[key];
            sources[key] = { priority, source };
          }
        }
      });
    });
    
    // Add metadata về data sources
    result._collection_meta = {
      sources: Object.keys(sources).reduce((acc, key) => {
        acc[key] = sources[key].source;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };
    
    return result;
  }
};

/**
 * Data Validation Rules
 */
export const DATA_VALIDATION = {
  /**
   * Validate data against schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Schema to validate against  
   * @returns {Object} - Validation result
   */
  validate: (data, schema = BASE_DATA_LAYER_SCHEMA) => {
    const errors = [];
    const warnings = [];
    
    // Check required fields
    Object.keys(schema).forEach(key => {
      const fieldSchema = schema[key];
      if (fieldSchema.required && (!data || !data.hasOwnProperty(key))) {
        errors.push(`Missing required field: ${key}`);
      }
    });
    
    // Type checking
    Object.keys(data || {}).forEach(key => {
      const fieldSchema = schema[key];
      if (fieldSchema && fieldSchema.type) {
        const actualType = typeof data[key];
        const expectedType = fieldSchema.type;
        
        if (actualType !== expectedType && data[key] !== null) {
          warnings.push(`Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Calculate data quality score
   * @param {Object} data - Data to score
   * @returns {Object} - Quality score and details
   */
  calculateQuality: (data) => {
    let score = 100;
    const issues = [];
    
    // Deduct for missing critical e-commerce data
    if (data.ecommerce) {
      if (!data.ecommerce.product_name) { score -= 15; issues.push('Missing product name'); }
      if (!data.ecommerce.product_price) { score -= 20; issues.push('Missing product price'); }
      if (!data.ecommerce.currency) { score -= 5; issues.push('Missing currency'); }
    }
    
    // Deduct for invalid email
    if (data.user?.email) {
      const cleanEmail = DATA_PROCESSING_RULES.email.clean(data.user.email);
      if (!cleanEmail) {
        score -= 10;
        issues.push('Invalid email format');
      }
    }
    
    // Bonus for rich data
    if (data._collection_meta?.sources) {
      const sourceCount = Object.keys(data._collection_meta.sources).length;
      if (sourceCount > 5) score += 5; // Rich data bonus
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues
    };
  }
};

/**
 * Facebook CAPI Data Preparation
 */
export const FACEBOOK_CAPI = {
  /**
   * Prepare data for Facebook CAPI
   * @param {Object} data - Raw data
   * @param {string} eventName - Event name  
   * @returns {Object} - CAPI-ready data
   */
  prepareData: (data, eventName) => {
    const capiData = {};
    
    // Map ecommerce data to Facebook parameters
    if (data.ecommerce) {
      const ecom = data.ecommerce;
      
      if (ecom.product_id) capiData.content_id = ecom.product_id;
      if (ecom.product_name) capiData.content_name = ecom.product_name;
      if (ecom.product_category) capiData.content_category = ecom.product_category;
      if (ecom.product_price) capiData.value = ecom.product_price;
      if (ecom.currency) capiData.currency = ecom.currency;
      if (ecom.order_id) capiData.order_id = ecom.order_id;
    }
    
    // Hash PII data
    if (data.user) {
      if (data.user.email) {
        capiData.em = DATA_PROCESSING_RULES.pii.hash(data.user.email);
      }
    }
    
    // Add metadata
    capiData._prepared_at = new Date().toISOString();
    capiData._event_name = eventName;
    
    return capiData;
  }
};

/**
 * Export utility functions
 */
export default {
  PLATFORM_TYPES,
  DATA_PRIORITY,
  BASE_DATA_LAYER_SCHEMA,
  PLATFORM_TEMPLATES,
  DATA_PROCESSING_RULES,
  DATA_MERGE_STRATEGY,
  DATA_VALIDATION,
  FACEBOOK_CAPI
};