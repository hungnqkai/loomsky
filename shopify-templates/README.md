# LoomSky Shopify Integration Templates

This directory contains Liquid templates và configuration files for integrating LoomSky tracking với Shopify stores.

## 📁 Files Structure

```
shopify-templates/
├── loomsky-data-layer.liquid     # Main data layer template
├── settings_schema.json          # Theme settings configuration
├── checkout-tracking.liquid      # Checkout process tracking
└── README.md                     # This file
```

## 🚀 Installation Guide

### Method 1: Manual Theme Integration

1. **Add Data Layer Template**
   ```liquid
   <!-- In theme.liquid, before closing </head> tag -->
   {% include 'loomsky-data-layer' %}
   ```

2. **Configure Theme Settings**
   - Add settings from `settings_schema.json` to your theme's `config/settings_schema.json`
   - Configure LoomSky API key in theme customizer

3. **Optional: Checkout Tracking**
   - Add `checkout-tracking.liquid` to checkout flow for order completion tracking

### Method 2: Shopify App (Future Implementation)

The complete Shopify app will include:
- Automatic template injection
- Admin dashboard for configuration
- Real-time data quality monitoring
- Advanced mapping options

## ⚙️ Configuration Options

### Required Settings
- `loomsky_api_key`: Your LoomSky API key
- `loomsky_sdk_url`: SDK URL (default: CDN)

### Optional Settings
- `loomsky_debug_mode`: Enable debug logging
- `loomsky_custom_events`: Additional event tracking
- `loomsky_privacy_mode`: Enhanced privacy compliance

## 📊 Data Layer Structure

The generated `loomskyDataLayer` includes:

### Platform Data
```javascript
{
  platform: 'shopify',
  page_type: 'product', // Dynamic based on template
}
```

### User Data
```javascript
{
  user: {
    is_logged_in: true,
    user_id: 'customer_123',
    email: 'customer@example.com',
    orders_count: 5,
    total_spent: 299.99
  }
}
```

### E-commerce Data
```javascript
{
  ecommerce: {
    // Product page
    product_id: '123456789',
    product_name: 'Amazing Product',
    product_price: 99.99,
    product_vendor: 'Brand Name',
    
    // Cart data
    cart_total: 199.98,
    cart_items_count: 2,
    cart_items: [...],
    
    // Order data (thank you page)
    order_id: 'ORD123',
    order_total: 199.98,
    order_items: [...]
  }
}
```

## 🎯 Page Type Detection

Automatic page type detection based on Shopify templates:

| Template | Page Type | Data Available |
|----------|-----------|----------------|
| `product` | product | Product details, variants |
| `collection` | category | Collection info, products |
| `cart` | cart | Cart items, totals |
| `search` | search | Search query, results |
| `customers/order` | thank_you | Order details, items |
| `page` | page | Basic page info |
| `article` | article | Blog post data |
| `index` | home | Homepage data |

## 🔧 Advanced Features

### 1. Multi-Currency Support
Automatically handles Shopify's multi-currency setup:
```liquid
currency: {{ cart.currency.iso_code | json }},
```

### 2. Variant Tracking
Comprehensive product variant data:
```liquid
product_variants: [
  {% for variant in product.variants %}
  {
    id: {{ variant.id }},
    price: {{ variant.price | money_without_currency }},
    available: {{ variant.available }}
  }
  {% endfor %}
]
```

### 3. Customer Insights
Rich customer data for personalization:
```liquid
user: {
  accepts_marketing: {{ customer.accepts_marketing }},
  orders_count: {{ customer.orders_count }},
  total_spent: {{ customer.total_spent | money_without_currency }}
}
```

## 🛡️ Privacy & Compliance

### GDPR Compliance
- Email data is collected but hashed on client-side
- Customer consent management integration
- Data retention policy compliance

### Data Security
- No sensitive payment data collected
- PII hashing before transmission
- Secure API key handling

## 📈 Performance Optimization

### Loading Strategy
- Async SDK loading for non-blocking performance
- Minimal Liquid processing overhead
- Conditional data loading based on page type

### Caching Considerations
- Data layer generated server-side for speed
- Static data cached in Shopify's CDN
- Dynamic data refreshed on page navigation

## 🐛 Debug Mode

Enable debug mode in theme settings:
```liquid
{% if settings.loomsky_debug_mode %}
console.log('LoomSky Shopify Data Layer:', window.loomskyDataLayer);
{% endif %}
```

## 📞 Support

For implementation support:
1. Check template compatibility
2. Validate theme settings configuration
3. Test data layer output in browser console
4. Contact LoomSky support for advanced integration

## 🚦 Implementation Status

- ✅ Basic data layer template
- ✅ Product page integration
- ✅ Cart và checkout support
- ✅ Customer data collection
- ⏳ Shopify app development (Phase 3+)
- ⏳ Advanced variant tracking
- ⏳ Real-time inventory integration