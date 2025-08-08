<?php
/**
 * File: wordpress-plugin/includes/class-loomsky-data-layer.php (CONCEPT)
 * WordPress Plugin Data Layer Generation Strategy
 * 
 * IMPORTANT: This is a conceptual design file for Phase 2.
 * Full plugin implementation will be done in a later phase.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * LoomSky Data Layer Generator for WordPress
 * 
 * Generates loomskyDataLayer với rich WordPress và WooCommerce data
 * Priority: Platform data (medium priority) - can be overridden by manual mapping
 */
class LoomSky_Data_Layer {
    
    /**
     * Plugin version
     */
    const VERSION = '1.0.0';
    
    /**
     * Data layer variable name
     */
    const DATA_LAYER_VAR = 'loomskyDataLayer';
    
    /**
     * Initialize the data layer generator
     */
    public function __construct() {
        add_action('wp_head', array($this, 'output_data_layer'), 5);
        add_action('wp_footer', array($this, 'output_sdk_script'), 20);
    }
    
    /**
     * Generate và output data layer to page head
     */
    public function output_data_layer() {
        $data_layer = $this->generate_data_layer();
        
        if (!empty($data_layer)) {
            echo '<script type="text/javascript">';
            echo 'window.' . self::DATA_LAYER_VAR . ' = ' . wp_json_encode($data_layer) . ';';
            echo '</script>';
        }
    }
    
    /**
     * Generate comprehensive data layer for current page
     * 
     * @return array Complete data layer structure
     */
    private function generate_data_layer() {
        global $post, $woocommerce;
        
        $data_layer = array(
            'platform' => 'wordpress',
            'page_type' => $this->get_page_type(),
            'user' => $this->get_user_data(),
            'ecommerce' => array()
        );
        
        // Add WooCommerce data if available
        if (class_exists('WooCommerce')) {
            $data_layer['ecommerce'] = $this->get_woocommerce_data();
        }
        
        // Add WordPress-specific data
        $data_layer['wordpress'] = $this->get_wordpress_data();
        
        return apply_filters('loomsky_data_layer', $data_layer);
    }
    
    /**
     * Detect current page type
     * 
     * @return string Page type identifier
     */
    private function get_page_type() {
        if (function_exists('is_shop') && is_shop()) {
            return 'shop';
        } elseif (function_exists('is_product') && is_product()) {
            return 'product';
        } elseif (function_exists('is_cart') && is_cart()) {
            return 'cart';
        } elseif (function_exists('is_checkout') && is_checkout()) {
            return 'checkout';
        } elseif (function_exists('is_order_received_page') && is_order_received_page()) {
            return 'thank_you';
        } elseif (is_home() || is_front_page()) {
            return 'home';
        } elseif (is_category() || is_tag() || is_archive()) {
            return 'category';
        } elseif (is_single()) {
            return 'post';
        } elseif (is_page()) {
            return 'page';
        }
        
        return 'page';
    }
    
    /**
     * Get current user data
     * 
     * @return array User information
     */
    private function get_user_data() {
        $user_data = array(
            'is_logged_in' => is_user_logged_in(),
            'user_id' => null,
            'email' => null,
            'role' => 'guest'
        );
        
        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            $user_data['user_id'] = (string) $current_user->ID;
            $user_data['email'] = $current_user->user_email; // Will be hashed on frontend
            $user_data['role'] = !empty($current_user->roles) ? $current_user->roles[0] : 'subscriber';
        }
        
        return $user_data;
    }
    
    /**
     * Get WooCommerce-specific data
     * 
     * @return array WooCommerce data
     */
    private function get_woocommerce_data() {
        if (!class_exists('WooCommerce')) {
            return array();
        }
        
        $woo_data = array(
            'currency' => get_woocommerce_currency()
        );
        
        // Product page data
        if (is_product()) {
            global $product;
            if ($product && is_a($product, 'WC_Product')) {
                $woo_data = array_merge($woo_data, array(
                    'product_id' => (string) $product->get_id(),
                    'product_name' => $product->get_name(),
                    'product_price' => (float) $product->get_price(),
                    'product_category' => $this->get_product_categories($product),
                    'product_type' => $product->get_type(),
                    'product_sku' => $product->get_sku(),
                    'product_stock' => $product->get_stock_quantity(),
                    'product_availability' => $product->is_in_stock() ? 'in_stock' : 'out_of_stock'
                ));
                
                // Variable product data
                if ($product->is_type('variable')) {
                    $woo_data['product_variations'] = $this->get_product_variations($product);
                }
            }
        }
        
        // Cart data
        if (function_exists('WC') && WC()->cart && !WC()->cart->is_empty()) {
            $cart = WC()->cart;
            $woo_data = array_merge($woo_data, array(
                'cart_total' => (float) $cart->get_total('edit'),
                'cart_subtotal' => (float) $cart->get_subtotal(),
                'cart_tax' => (float) $cart->get_total_tax(),
                'cart_items_count' => $cart->get_cart_contents_count(),
                'cart_items' => $this->get_cart_items()
            ));
        }
        
        // Order data (thank you page)
        if (is_order_received_page()) {
            $order_id = get_query_var('order-received');
            if ($order_id) {
                $order = wc_get_order($order_id);
                if ($order) {
                    $woo_data = array_merge($woo_data, array(
                        'order_id' => (string) $order->get_id(),
                        'order_total' => (float) $order->get_total(),
                        'order_subtotal' => (float) $order->get_subtotal(),
                        'order_tax' => (float) $order->get_total_tax(),
                        'order_shipping' => (float) $order->get_shipping_total(),
                        'order_items' => $this->get_order_items($order),
                        'payment_method' => $order->get_payment_method(),
                        'order_status' => $order->get_status()
                    ));
                }
            }
        }
        
        return $woo_data;
    }
    
    /**
     * Get WordPress-specific data
     * 
     * @return array WordPress metadata
     */
    private function get_wordpress_data() {
        global $post;
        
        $wp_data = array(
            'version' => get_bloginfo('version'),
            'theme' => get_template(),
            'language' => get_locale()
        );
        
        if ($post) {
            $wp_data = array_merge($wp_data, array(
                'post_id' => $post->ID,
                'post_type' => $post->post_type,
                'post_title' => $post->post_title,
                'post_author' => get_the_author_meta('display_name', $post->post_author),
                'post_date' => $post->post_date,
                'post_categories' => $this->get_post_categories($post)
            ));
        }
        
        return $wp_data;
    }
    
    /**
     * Get product categories
     * 
     * @param WC_Product $product
     * @return string Primary category name
     */
    private function get_product_categories($product) {
        $categories = wp_get_post_terms($product->get_id(), 'product_cat');
        return !empty($categories) ? $categories[0]->name : '';
    }
    
    /**
     * Get product variations for variable products
     * 
     * @param WC_Product_Variable $product
     * @return array Variation data
     */
    private function get_product_variations($product) {
        $variations = array();
        $variation_ids = $product->get_children();
        
        foreach ($variation_ids as $variation_id) {
            $variation = wc_get_product($variation_id);
            if ($variation) {
                $variations[] = array(
                    'id' => (string) $variation->get_id(),
                    'sku' => $variation->get_sku(),
                    'price' => (float) $variation->get_price(),
                    'attributes' => $variation->get_variation_attributes()
                );
            }
        }
        
        return $variations;
    }
    
    /**
     * Get cart items data
     * 
     * @return array Cart items
     */
    private function get_cart_items() {
        if (!function_exists('WC') || !WC()->cart) {
            return array();
        }
        
        $cart_items = array();
        foreach (WC()->cart->get_cart() as $cart_item) {
            $product = $cart_item['data'];
            $cart_items[] = array(
                'product_id' => (string) $product->get_id(),
                'product_name' => $product->get_name(),
                'product_price' => (float) $product->get_price(),
                'quantity' => $cart_item['quantity'],
                'line_total' => (float) $cart_item['line_total']
            );
        }
        
        return $cart_items;
    }
    
    /**
     * Get order items data
     * 
     * @param WC_Order $order
     * @return array Order items
     */
    private function get_order_items($order) {
        $order_items = array();
        
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            $order_items[] = array(
                'product_id' => (string) $product->get_id(),
                'product_name' => $product->get_name(),
                'product_price' => (float) $product->get_price(),
                'quantity' => $item->get_quantity(),
                'line_total' => (float) $item->get_total()
            );
        }
        
        return $order_items;
    }
    
    /**
     * Get post categories
     * 
     * @param WP_Post $post
     * @return array Category names
     */
    private function get_post_categories($post) {
        $categories = get_the_category($post->ID);
        return array_map(function($cat) {
            return $cat->name;
        }, $categories);
    }
    
    /**
     * Output LoomSky SDK script
     */
    public function output_sdk_script() {
        $api_key = get_option('loomsky_api_key');
        $sdk_url = get_option('loomsky_sdk_url', 'https://sdk.loomsky.com/loomsky.min.js');
        
        if (!empty($api_key)) {
            echo '<script async src="' . esc_url($sdk_url) . '" data-api-key="' . esc_attr($api_key) . '"></script>';
        }
    }
}

/**
 * IMPLEMENTATION STRATEGY NOTES:
 * 
 * 1. PLUGIN STRUCTURE:
 *    - Main plugin file: loomsky-wordpress-plugin.php
 *    - Admin settings: includes/class-loomsky-admin.php
 *    - Data layer: includes/class-loomsky-data-layer.php (this file)
 *    - Utilities: includes/class-loomsky-utils.php
 * 
 * 2. FEATURES TO IMPLEMENT:
 *    - WordPress admin settings page
 *    - API key configuration
 *    - WooCommerce integration detection
 *    - Custom field mapping support
 *    - Debug mode for developers
 *    - GDPR compliance options
 * 
 * 3. HOOKS & FILTERS:
 *    - loomsky_data_layer: Filter complete data layer
 *    - loomsky_user_data: Filter user data
 *    - loomsky_product_data: Filter product data
 *    - loomsky_before_output: Action before outputting data layer
 * 
 * 4. ADMIN OPTIONS:
 *    - loomsky_api_key: LoomSky API key
 *    - loomsky_sdk_url: SDK URL (default: CDN)
 *    - loomsky_enable_debug: Debug mode
 *    - loomsky_custom_mappings: Custom field mappings
 *    - loomsky_privacy_mode: Hash PII data
 * 
 * 5. SECURITY CONSIDERATIONS:
 *    - Sanitize all output data
 *    - Hash PII data before output
 *    - Validate API key format
 *    - Nonce protection for admin forms
 * 
 * 6. PERFORMANCE OPTIMIZATIONS:
 *    - Cache data layer generation
 *    - Minimize database queries
 *    - Conditional loading based on page type
 *    - Lazy load heavy operations
 */

// Initialize if in WordPress environment
if (defined('ABSPATH')) {
    new LoomSky_Data_Layer();
}
?>