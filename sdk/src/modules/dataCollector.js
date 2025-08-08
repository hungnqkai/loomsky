/*
File: sdk/src/modules/dataCollector.js (SIMPLIFIED)
- Simplified collector focused on manual mapping
- Enhanced data processing với standardized rules
- Better error handling và validation
*/

import { DATA_PROCESSING_RULES, DATA_PRIORITY } from '../constants/dataStandards.js';

/**
 * Simplified DataCollector focused on manual mapping
 * Removes auto-detection, focuses on user-defined selectors
 */
class DataCollector {
    /**
     * @param {Array<object>} mappings - User-defined data mappings từ API config
     */
    constructor(mappings = []) {
        this.mappings = mappings;
        this.collectedData = {};
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Enhanced value extraction với data type processing
     * @param {HTMLElement} element - DOM element
     * @param {string} dataType - Expected data type (string, number, email)
     * @returns {any|null}
     * @private
     */
    _extractValue(element, dataType = 'string') {
        if (!element) return null;
        
        let rawValue = null;
        
        // Extract raw value based on element type
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
            rawValue = element.value;
        } else if (element.hasAttribute('data-value')) {
            // Support for data-value attributes
            rawValue = element.getAttribute('data-value');
        } else {
            // Get text content, prioritize innerText over textContent
            rawValue = element.innerText || element.textContent;
        }
        
        if (!rawValue) return null;
        
        // Process value based on expected data type
        try {
            switch (dataType.toLowerCase()) {
                case 'number':
                case 'price':
                case 'currency':
                    return DATA_PROCESSING_RULES.number.clean(rawValue);
                    
                case 'email':
                    return DATA_PROCESSING_RULES.email.clean(rawValue);
                    
                case 'string':
                case 'text':
                default:
                    return DATA_PROCESSING_RULES.string.clean(rawValue);
            }
        } catch (error) {
            this.warnings.push(`Failed to process ${dataType} value: ${rawValue}`);
            return DATA_PROCESSING_RULES.string.clean(rawValue); // Fallback to string
        }
    }

    /**
     * Collect data from a specific mapping
     * @param {object} mapping - Single mapping object
     * @returns {object} - Collection result
     * @private
     */
    _collectFromMapping(mapping) {
        const result = {
            variable_name: mapping.variable_name,
            value: null,
            success: false,
            error: null
        };
        
        try {
            const element = document.querySelector(mapping.selector);
            
            if (!element) {
                result.error = `Element not found: ${mapping.selector}`;
                return result;
            }
            
            const value = this._extractValue(element, mapping.data_type || 'string');
            
            if (value !== null) {
                result.value = value;
                result.success = true;
            } else {
                result.error = 'Element found but value is empty';
            }
            
        } catch (error) {
            result.error = `Invalid selector "${mapping.selector}": ${error.message}`;
            this.errors.push(result.error);
        }
        
        return result;
    }

    /**
     * Simplified collection - only manual mappings
     * @returns {object} - Collected data với metadata
     */
    collectAll() {
        console.log('LoomSky SDK: Collecting manual data mappings...');
        
        this.collectedData = {};
        this.errors = [];
        this.warnings = [];
        
        if (!this.mappings || this.mappings.length === 0) {
            console.log('LoomSky SDK: No manual mappings configured');
            return this._buildResult();
        }

        let successCount = 0;
        
        this.mappings.forEach(mapping => {
            const result = this._collectFromMapping(mapping);
            
            if (result.success) {
                this.collectedData[result.variable_name] = result.value;
                successCount++;
            } else {
                console.warn(`LoomSky SDK: ${result.error}`);
            }
        });

        console.log(`LoomSky SDK: Manual data collection complete. ${successCount}/${this.mappings.length} mappings successful.`);
        
        return this._buildResult();
    }

    /**
     * Build collection result với metadata
     * @returns {object}
     * @private
     */
    _buildResult() {
        return {
            data: this.collectedData,
            metadata: {
                source: 'manual_mapping',
                priority: DATA_PRIORITY.MANUAL_MAPPING,
                collection_time: new Date().toISOString(),
                mappings_total: this.mappings.length,
                mappings_successful: Object.keys(this.collectedData).length,
                errors: this.errors,
                warnings: this.warnings
            }
        };
    }

    /**
     * Get collection statistics
     * @returns {object}
     */
    getStats() {
        return {
            total_mappings: this.mappings.length,
            successful_mappings: Object.keys(this.collectedData).length,
            success_rate: this.mappings.length > 0 ? 
                (Object.keys(this.collectedData).length / this.mappings.length) * 100 : 0,
            error_count: this.errors.length,
            warning_count: this.warnings.length
        };
    }

    /**
     * Test a single selector without collecting
     * @param {string} selector - CSS selector to test
     * @returns {object} - Test result
     */
    testSelector(selector) {
        try {
            const elements = document.querySelectorAll(selector);
            return {
                valid: true,
                elements_found: elements.length,
                sample_values: Array.from(elements).slice(0, 3).map(el => 
                    this._extractValue(el, 'string')
                )
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
}

export default DataCollector;
