/*
File: src/constants/eventStandards.js
- Frontend event definitions với UI metadata
- Standardized event categories và descriptions
- Visual indicators và Facebook mapping display
*/

/**
 * Event Categories với UI metadata
 */
export const EVENT_CATEGORIES = {
  NAVIGATION: {
    key: 'navigation',
    name: 'Navigation',
    icon: 'mdi-compass-outline',
    color: '#3b82f6',
    description: 'Page navigation và session tracking'
  },
  ECOMMERCE: {
    key: 'ecommerce',
    name: 'E-commerce',
    icon: 'mdi-cart-outline',
    color: '#10b981', 
    description: 'Shopping và purchase events'
  },
  CONVERSION: {
    key: 'conversion',
    name: 'Conversion',
    icon: 'mdi-target',
    color: '#f59e0b',
    description: 'Goals và conversion tracking'
  },
  ENGAGEMENT: {
    key: 'engagement',
    name: 'Engagement',
    icon: 'mdi-chart-line',
    color: '#8b5cf6',
    description: 'User engagement measurements'
  },
  INTERACTION: {
    key: 'interaction',
    name: 'Interaction',
    icon: 'mdi-cursor-default-click-outline',
    color: '#ef4444',
    description: 'User interactions và clicks'
  }
};

/**
 * Standardized Events với UI metadata
 */
export const STANDARD_EVENTS = {
  // 🧭 Navigation Events
  PAGE_VIEW: {
    name: 'PageView',
    title: 'Page View',
    category: EVENT_CATEGORIES.NAVIGATION,
    facebook_event: 'PageView',
    description: 'Theo dõi lượt xem trang',
    icon: 'mdi-file-document-outline',
    ui_metadata: {
      groupName: 'Navigation',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: true,
      complexity: 'basic'
    }
  },
  SESSION_START: {
    name: 'SessionStart',
    title: 'Session Start',
    category: EVENT_CATEGORIES.NAVIGATION,
    facebook_event: null,
    description: 'Bắt đầu phiên truy cập',
    icon: 'mdi-play-circle-outline',
    ui_metadata: {
      groupName: 'Navigation',
      showInStandardList: false,
      isPopular: false,
      defaultEnabled: true,
      complexity: 'basic'
    }
  },

  // 🛒 E-commerce Events
  VIEW_CONTENT: {
    name: 'ViewContent',
    title: 'View Content',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'ViewContent',
    description: 'Xem chi tiết sản phẩm',
    icon: 'mdi-eye-outline',
    ui_metadata: {
      groupName: 'E-commerce',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'intermediate'
    }
  },
  ADD_TO_CART: {
    name: 'AddToCart',
    title: 'Add to Cart',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'AddToCart',
    description: 'Thêm sản phẩm vào giỏ hàng',
    icon: 'mdi-cart-plus',
    ui_metadata: {
      groupName: 'E-commerce',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'intermediate'
    }
  },
  INITIATE_CHECKOUT: {
    name: 'InitiateCheckout',
    title: 'Initiate Checkout',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'InitiateCheckout',
    description: 'Bắt đầu quá trình thanh toán',
    icon: 'mdi-cash-register',
    ui_metadata: {
      groupName: 'E-commerce',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'advanced'
    }
  },
  ADD_PAYMENT_INFO: {
    name: 'AddPaymentInfo',
    title: 'Add Payment Info',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'AddPaymentInfo',
    description: 'Nhập thông tin thanh toán',
    icon: 'mdi-credit-card-outline',
    ui_metadata: {
      groupName: 'E-commerce',
      showInStandardList: true,
      isPopular: false,
      defaultEnabled: false,
      complexity: 'advanced'
    }
  },
  PURCHASE: {
    name: 'Purchase',
    title: 'Purchase',
    category: EVENT_CATEGORIES.ECOMMERCE,
    facebook_event: 'Purchase',
    description: 'Hoàn tất mua hàng',
    icon: 'mdi-shopping',
    ui_metadata: {
      groupName: 'E-commerce',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'advanced'
    }
  },

  // 🎯 Conversion Events
  LEAD: {
    name: 'Lead',
    title: 'Lead',
    category: EVENT_CATEGORIES.CONVERSION,
    facebook_event: 'Lead',
    description: 'Khách hàng tiềm năng',
    icon: 'mdi-account-plus-outline',
    ui_metadata: {
      groupName: 'Conversion',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'intermediate'
    }
  },
  COMPLETE_REGISTRATION: {
    name: 'CompleteRegistration',
    title: 'Complete Registration',
    category: EVENT_CATEGORIES.CONVERSION,
    facebook_event: 'CompleteRegistration',
    description: 'Hoàn tất đăng ký tài khoản',
    icon: 'mdi-account-check-outline',
    ui_metadata: {
      groupName: 'Conversion',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'intermediate'
    }
  },
  FORM_SUBMIT: {
    name: 'FormSubmit',
    title: 'Form Submit',
    category: EVENT_CATEGORIES.CONVERSION,
    facebook_event: 'Lead',
    description: 'Gửi form liên hệ',
    icon: 'mdi-form-select',
    ui_metadata: {
      groupName: 'Conversion',
      showInStandardList: true,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'intermediate'
    }
  },

  // 👆 Engagement Events
  SCROLL_DEPTH_25: {
    name: 'ScrollDepth25',
    title: '25% Scroll Depth',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Cuộn trang đến 25%',
    icon: 'mdi-arrow-down',
    ui_metadata: {
      groupName: 'Scroll Tracking',
      showInStandardList: false,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'basic'
    }
  },
  SCROLL_DEPTH_50: {
    name: 'ScrollDepth50',
    title: '50% Scroll Depth',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Cuộn trang đến 50%',
    icon: 'mdi-arrow-down',
    ui_metadata: {
      groupName: 'Scroll Tracking',
      showInStandardList: false,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'basic'
    }
  },
  SCROLL_DEPTH_75: {
    name: 'ScrollDepth75',
    title: '75% Scroll Depth',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Cuộn trang đến 75%',
    icon: 'mdi-arrow-down',
    ui_metadata: {
      groupName: 'Scroll Tracking',
      showInStandardList: false,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'basic'
    }
  },
  TIME_ON_PAGE_15S: {
    name: 'TimeOnPage15s',
    title: '15 Seconds Time',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 15 giây',
    icon: 'mdi-timer-outline',
    ui_metadata: {
      groupName: 'Time Engagement',
      showInStandardList: false,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'basic'
    }
  },
  TIME_ON_PAGE_30S: {
    name: 'TimeOnPage30s',
    title: '30 Seconds Time',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 30 giây',
    icon: 'mdi-timer-outline',
    ui_metadata: {
      groupName: 'Time Engagement',
      showInStandardList: false,
      isPopular: true,
      defaultEnabled: false,
      complexity: 'basic'
    }
  },
  TIME_ON_PAGE_60S: {
    name: 'TimeOnPage60s',
    title: '60 Seconds Time',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 60 giây',
    icon: 'mdi-timer-outline',
    ui_metadata: {
      groupName: 'Time Engagement',
      showInStandardList: false,
      isPopular: false,
      defaultEnabled: false,
      complexity: 'basic'
    }
  },
  TIME_ON_PAGE_90S: {
    name: 'TimeOnPage90s',
    title: '90 Seconds Time',
    category: EVENT_CATEGORIES.ENGAGEMENT,
    facebook_event: null,
    description: 'Ở lại trang 90 giây',
    icon: 'mdi-timer-outline',
    ui_metadata: {
      groupName: 'Time Engagement',
      showInStandardList: false,
      isPopular: false,
      defaultEnabled: false,
      complexity: 'basic'
    }
  },

  // 🔗 Interaction Events
  CLICK_ELEMENT: {
    name: 'ClickElement',
    title: 'Click Element',
    category: EVENT_CATEGORIES.INTERACTION,
    facebook_event: null,
    description: 'Click vào element cụ thể',
    icon: 'mdi-cursor-default-click',
    ui_metadata: {
      groupName: 'Interactions',
      showInStandardList: false,
      isPopular: false,
      defaultEnabled: false,
      complexity: 'advanced'
    }
  },
  VIDEO_PLAY: {
    name: 'VideoPlay',
    title: 'Video Play',
    category: EVENT_CATEGORIES.INTERACTION,
    facebook_event: null,
    description: 'Phát video',
    icon: 'mdi-play-circle-outline',
    ui_metadata: {
      groupName: 'Interactions',
      showInStandardList: false,
      isPopular: false,
      defaultEnabled: false,
      complexity: 'intermediate'
    }
  },
  VIDEO_COMPLETE: {
    name: 'VideoComplete',
    title: 'Video Complete',
    category: EVENT_CATEGORIES.INTERACTION,
    facebook_event: null,
    description: 'Hoàn thành xem video',
    icon: 'mdi-check-circle-outline',
    ui_metadata: {
      groupName: 'Interactions',
      showInStandardList: false,
      isPopular: false,
      defaultEnabled: false,
      complexity: 'intermediate'
    }
  }
};

/**
 * Migration mapping từ old names sang new names
 */
export const EVENT_MIGRATION_MAP = {
  'PageView': 'PageView', // Already correct
  'ViewContent': 'ViewContent', // Already correct
  'AddToCart': 'AddToCart', // Already correct
  'Purchase': 'Purchase', // Already correct
  'Lead': 'Lead', // Already correct
  'CompleteRegistration': 'CompleteRegistration', // Already correct
  
  // Old custom events cần migrate
  'scroll_25': 'ScrollDepth25',
  'scroll_50': 'ScrollDepth50',
  'scroll_75': 'ScrollDepth75',
  'scroll_90': 'ScrollDepth75', // Map 90% to 75% as per new standard
  'time_10s': 'TimeOnPage15s', // Map 10s to 15s as per new standard
  'time_30s': 'TimeOnPage30s',
  'time_1m': 'TimeOnPage60s',
  'time_1_5m': 'TimeOnPage60s', // Map longer times to 60s
  'time_2m': 'TimeOnPage60s',
  'time_3m': 'TimeOnPage60s',
  'time_5m': 'TimeOnPage60s'
};

/**
 * Helper Functions cho Frontend
 */

/**
 * Get events by category
 */
export const getEventsByCategory = (categoryKey) => {
  return Object.values(STANDARD_EVENTS).filter(event => event.category.key === categoryKey);
};

/**
 * Get events by group name (UI grouping)
 */
export const getEventsByGroup = (groupName) => {
  return Object.values(STANDARD_EVENTS).filter(event => event.ui_metadata.groupName === groupName);
};

/**
 * Get popular events
 */
export const getPopularEvents = () => {
  return Object.values(STANDARD_EVENTS).filter(event => event.ui_metadata.isPopular);
};

/**
 * Get events that should show in standard list
 */
export const getStandardListEvents = () => {
  return Object.values(STANDARD_EVENTS).filter(event => event.ui_metadata.showInStandardList);
};

/**
 * Get Facebook compatible events
 */
export const getFacebookCompatibleEvents = () => {
  return Object.values(STANDARD_EVENTS).filter(event => event.facebook_event !== null);
};

/**
 * Get default enabled events
 */
export const getDefaultEnabledEvents = () => {
  return Object.values(STANDARD_EVENTS)
    .filter(event => event.ui_metadata.defaultEnabled)
    .map(event => event.name);
};

/**
 * Get event groups
 */
export const getEventGroups = () => {
  const groups = {};
  Object.values(STANDARD_EVENTS).forEach(event => {
    const groupName = event.ui_metadata.groupName;
    if (!groups[groupName]) {
      groups[groupName] = {
        name: groupName,
        events: [],
        category: event.category
      };
    }
    groups[groupName].events.push(event);
  });
  return Object.values(groups);
};

/**
 * Migrate old event name to new standardized name
 */
export const migrateEventName = (oldName) => {
  return EVENT_MIGRATION_MAP[oldName] || oldName;
};

/**
 * Check if event is Facebook compatible
 */
export const isFacebookCompatible = (eventName) => {
  const event = Object.values(STANDARD_EVENTS).find(e => e.name === eventName);
  return event && event.facebook_event !== null;
};

/**
 * Get Facebook event name
 */
export const getFacebookEventName = (eventName) => {
  const event = Object.values(STANDARD_EVENTS).find(e => e.name === eventName);
  return event ? event.facebook_event : null;
};

/**
 * Get event definition by name
 */
export const getEventDefinition = (eventName) => {
  return Object.values(STANDARD_EVENTS).find(event => event.name === eventName) || null;
};