/*
File: src/constants/eventStandards.js
- Event schema definitions với Facebook mapping
- Standardized event categories và naming conventions
- Migration support cho old event names
*/
'use strict';

/**
 * Event Categories - Phân loại sự kiện theo mục đích sử dụng
 */
const EVENT_CATEGORIES = {
  NAVIGATION: 'navigation',
  ECOMMERCE: 'ecommerce', 
  CONVERSION: 'conversion',
  ENGAGEMENT: 'engagement',
  INTERACTION: 'interaction'
};

/**
 * Standardized Events với Facebook CAPI mapping
 */
const STANDARD_EVENTS = {
  // 🧭 Navigation Events
  PAGE_VIEW: {
    name: 'PageView',
    category: EVENT_CATEGORIES.NAVIGATION,
    facebook_event: 'PageView',
    description: 'Xem trang',
    required_properties: ['page_url', 'page_title'],
    optional_properties: ['referrer', 'utm_source', 'utm_medium', 'utm_campaign']
  },
  SESSION_START: {
    name: 'SessionStart',
    category: EVENT_CATEGORIES.NAVIGATION,
    facebook_event: null,
    description: 'Bắt đầu session',
    required_properties: ['session_id'],
    optional_properties: ['landing_page', 'referrer']
  },

  // 🛒 E-commerce Events
  VIEW_CONTENT: {
    name: 'ViewContent',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'ViewContent',
    description: 'Xem sản phẩm',
    required_properties: ['content_type'],
    optional_properties: ['content_id', 'content_name', 'content_category', 'value', 'currency']
  },
  ADD_TO_CART: {
    name: 'AddToCart',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'AddToCart',
    description: 'Thêm vào giỏ hàng',
    required_properties: ['content_id', 'content_type'],
    optional_properties: ['content_name', 'content_category', 'value', 'currency', 'quantity']
  },
  INITIATE_CHECKOUT: {
    name: 'InitiateCheckout',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'InitiateCheckout',
    description: 'Bắt đầu thanh toán',
    required_properties: ['value', 'currency'],
    optional_properties: ['content_ids', 'contents', 'num_items']
  },
  ADD_PAYMENT_INFO: {
    name: 'AddPaymentInfo',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'AddPaymentInfo',
    description: 'Thêm thông tin thanh toán',
    required_properties: ['value', 'currency'],
    optional_properties: ['content_ids', 'contents']
  },
  PURCHASE: {
    name: 'Purchase',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'Purchase',
    description: 'Hoàn tất mua hàng',
    required_properties: ['value', 'currency', 'order_id'],
    optional_properties: ['content_ids', 'contents', 'num_items']
  },

  // 🎯 Conversion Events
  LEAD: {
    name: 'Lead',
    category: EVENT_CATEGORIES.CONVERSION,
    facebook_event: 'Lead',
    description: 'Khách hàng tiềm năng',
    required_properties: [],
    optional_properties: ['content_category', 'value', 'currency']
  },
  COMPLETE_REGISTRATION: {
    name: 'CompleteRegistration',
    category: EVENT_CATEGORIES.CONVERSION,
    facebook_event: 'CompleteRegistration',
    description: 'Hoàn tất đăng ký',
    required_properties: [],
    optional_properties: ['content_name', 'value', 'currency']
  },
  FORM_SUBMIT: {
    name: 'FormSubmit',
    category: EVENT_CATEGORIES.CONVERSION,
    facebook_event: 'Lead',
    description: 'Gửi form',
    required_properties: ['form_id', 'form_type'],
    optional_properties: ['form_name', 'value', 'currency']
  },

  // 👆 Engagement Events
  SCROLL_DEPTH_25: {
    name: 'ScrollDepth25',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Cuộn trang 25%',
    required_properties: ['scroll_percentage'],
    optional_properties: []
  },
  SCROLL_DEPTH_50: {
    name: 'ScrollDepth50',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Cuộn trang 50%',
    required_properties: ['scroll_percentage'],
    optional_properties: []
  },
  SCROLL_DEPTH_75: {
    name: 'ScrollDepth75',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Cuộn trang 75%',
    required_properties: ['scroll_percentage'],
    optional_properties: []
  },
  TIME_ON_PAGE_15S: {
    name: 'TimeOnPage15s',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 15 giây',
    required_properties: ['time_spent'],
    optional_properties: []
  },
  TIME_ON_PAGE_30S: {
    name: 'TimeOnPage30s',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 30 giây',
    required_properties: ['time_spent'],
    optional_properties: []
  },
  TIME_ON_PAGE_60S: {
    name: 'TimeOnPage60s',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 60 giây',
    required_properties: ['time_spent'],
    optional_properties: []
  },
  TIME_ON_PAGE_90S: {
    name: 'TimeOnPage90s',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 90 giây',
    required_properties: ['time_spent'],
    optional_properties: []
  },

  // 🔗 Interaction Events
  CLICK_ELEMENT: {
    name: 'ClickElement',
    category: EVENT_CATEGORIES.INTERACTION,
    facebook_event: null,
    description: 'Click element',
    required_properties: ['element_type', 'element_text'],
    optional_properties: ['element_id', 'element_class', 'page_url']
  },
  VIDEO_PLAY: {
    name: 'VideoPlay',
    category: EVENT_CATEGORIES.INTERACTION,
    facebook_event: null,
    description: 'Phát video',
    required_properties: ['video_title'],
    optional_properties: ['video_duration', 'video_position']
  },
  VIDEO_COMPLETE: {
    name: 'VideoComplete',
    category: EVENT_CATEGORIES.INTERACTION,
    facebook_event: null,
    description: 'Hoàn thành video',
    required_properties: ['video_title'],
    optional_properties: ['video_duration']
  }
};

/**
 * Migration mapping từ old names sang new standardized names
 */
const EVENT_MIGRATION_MAP = {
  'page_view': 'PageView',
  'view_content': 'ViewContent',
  'add_to_cart': 'AddToCart',
  'initiate_checkout': 'InitiateCheckout',
  'purchase': 'Purchase',
  'lead': 'Lead',
  'scroll_25': 'ScrollDepth25',
  'scroll_50': 'ScrollDepth50',
  'scroll_75': 'ScrollDepth75',
  'time_15s': 'TimeOnPage15s',
  'time_30s': 'TimeOnPage30s',
  'time_60s': 'TimeOnPage60s',
  'time_90s': 'TimeOnPage90s',
  'complete_registration': 'CompleteRegistration',
  'add_payment_info': 'AddPaymentInfo',
  'form_submit': 'FormSubmit',
  'click_element': 'ClickElement',
  'video_play': 'VideoPlay',
  'video_complete': 'VideoComplete',
  'session_start': 'SessionStart'
};

/**
 * Helper Functions
 */

/**
 * Normalize event name - migrate old names to standardized names
 * @param {string} eventName - Original event name
 * @returns {string} - Standardized event name
 */
const normalizeEventName = (eventName) => {
  if (!eventName) return null;
  
  // Nếu đã là standardized name, return as is
  const standardizedName = Object.values(STANDARD_EVENTS).find(event => event.name === eventName);
  if (standardizedName) return eventName;
  
  // Kiểm tra migration map
  const normalizedName = EVENT_MIGRATION_MAP[eventName.toLowerCase()];
  if (normalizedName) return normalizedName;
  
  // Fallback: convert to PascalCase
  return eventName.toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

/**
 * Get event definition by name
 * @param {string} eventName - Standardized event name
 * @returns {Object|null} - Event definition or null
 */
const getEventDefinition = (eventName) => {
  const normalizedName = normalizeEventName(eventName);
  return Object.values(STANDARD_EVENTS).find(event => event.name === normalizedName) || null;
};

/**
 * Check if event is Facebook CAPI compatible
 * @param {string} eventName - Event name
 * @returns {boolean} - True if Facebook compatible
 */
const isFacebookCompatible = (eventName) => {
  const eventDef = getEventDefinition(eventName);
  return eventDef && eventDef.facebook_event !== null;
};

/**
 * Get Facebook event name for CAPI
 * @param {string} eventName - Standard event name
 * @returns {string|null} - Facebook event name or null
 */
const getFacebookEventName = (eventName) => {
  const eventDef = getEventDefinition(eventName);
  return eventDef ? eventDef.facebook_event : null;
};

/**
 * Get events by category
 * @param {string} category - Event category
 * @returns {Array} - Array of events in category
 */
const getEventsByCategory = (category) => {
  return Object.values(STANDARD_EVENTS).filter(event => event.category === category);
};

/**
 * Validate required properties for event
 * @param {string} eventName - Event name
 * @param {Object} properties - Event properties
 * @returns {Object} - Validation result
 */
const validateEventProperties = (eventName, properties = {}) => {
  const eventDef = getEventDefinition(eventName);
  if (!eventDef) {
    return {
      valid: false,
      errors: [`Unknown event: ${eventName}`],
      warnings: []
    };
  }

  const errors = [];
  const warnings = [];

  // Check required properties
  eventDef.required_properties.forEach(prop => {
    if (!properties[prop] || properties[prop] === null || properties[prop] === undefined) {
      errors.push(`Missing required property: ${prop}`);
    }
  });

  // Validate property values
  if (properties.value && typeof properties.value !== 'number') {
    warnings.push('Property "value" should be a number');
  }

  if (properties.currency && typeof properties.currency !== 'string') {
    warnings.push('Property "currency" should be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    eventDefinition: eventDef
  };
};

module.exports = {
  EVENT_CATEGORIES,
  STANDARD_EVENTS,
  EVENT_MIGRATION_MAP,
  normalizeEventName,
  getEventDefinition,
  isFacebookCompatible,
  getFacebookEventName,
  getEventsByCategory,
  validateEventProperties
};