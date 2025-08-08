/*
File: src/validators/dataValidationPipeline.js
Comprehensive data validation pipeline for LoomSky event processing
- Multi-stage validation with quality scoring
- Facebook CAPI compatibility checks
- Data standardization and enrichment
- Configurable validation rules
*/
'use strict';

const Joi = require('joi');
const { STANDARD_EVENTS, EVENT_CATEGORIES } = require('../constants/eventStandards');
const { PLATFORM_TYPES, QUALITY_THRESHOLDS } = require('../constants/dataStandards');
const performanceMonitor = require('../utils/performanceMonitor');
const logger = require('../utils/logger');

/**
 * Data Validation Pipeline for event processing
 * Provides comprehensive validation, standardization, and quality scoring
 */
class DataValidationPipeline {
    constructor() {
        this.validationStages = [
            'structure',
            'standardization',
            'dataTypes',
            'businessRules',
            'facebookCapi',
            'privacy'
        ];
        
        this.qualityMetrics = {
            processed: 0,
            passed: 0,
            warnings: 0,
            errors: 0,
            qualityScores: []
        };

        this.validationRules = this._initValidationRules();
        this.facebookCapiMapping = this._initFacebookCapiMapping();
    }

    /**
     * Process event data through validation pipeline
     * @param {object} eventData - Raw event data
     * @param {object} options - Validation options
     * @returns {object} - Validation result with enriched data
     */
    async validateEventData(eventData, options = {}) {
        const timerId = performanceMonitor.startTimer('dataValidation', {
            eventName: eventData.event_name,
            platform: eventData.platform
        });

        try {
            this.qualityMetrics.processed++;

            const validationResult = {
                isValid: true,
                quality_score: 100,
                warnings: [],
                errors: [],
                standardizedData: { ...eventData },
                metadata: {
                    validationStages: {},
                    facebookCapiReady: false,
                    privacyCompliant: false,
                    dataCompleteness: 0
                }
            };

            // Run through validation stages
            for (const stage of this.validationStages) {
                const stageResult = await this._runValidationStage(
                    stage,
                    validationResult.standardizedData,
                    options
                );

                validationResult.metadata.validationStages[stage] = stageResult;
                validationResult.warnings.push(...stageResult.warnings);
                validationResult.errors.push(...stageResult.errors);

                if (stageResult.errors.length > 0) {
                    validationResult.isValid = false;
                }

                // Apply stage transformations
                if (stageResult.transformedData) {
                    validationResult.standardizedData = {
                        ...validationResult.standardizedData,
                        ...stageResult.transformedData
                    };
                }
            }

            // Calculate overall quality score
            validationResult.quality_score = this._calculateQualityScore(validationResult);
            validationResult.metadata.dataCompleteness = this._calculateDataCompleteness(
                validationResult.standardizedData
            );
            validationResult.metadata.facebookCapiReady = this._isFacebookCapiReady(
                validationResult.standardizedData
            );
            validationResult.metadata.privacyCompliant = this._isPrivacyCompliant(
                validationResult.standardizedData
            );

            // Update metrics
            if (validationResult.isValid) {
                this.qualityMetrics.passed++;
            } else {
                this.qualityMetrics.errors++;
            }

            if (validationResult.warnings.length > 0) {
                this.qualityMetrics.warnings++;
            }

            this.qualityMetrics.qualityScores.push(validationResult.quality_score);

            return validationResult;

        } catch (error) {
            this.qualityMetrics.errors++;
            logger.error('Data validation pipeline error:', error);
            return {
                isValid: false,
                quality_score: 0,
                warnings: [],
                errors: [`Validation pipeline error: ${error.message}`],
                standardizedData: eventData,
                metadata: { error: error.message }
            };
        } finally {
            performanceMonitor.endTimer(timerId);
        }
    }

    /**
     * Run specific validation stage
     * @param {string} stage - Validation stage name
     * @param {object} data - Data to validate
     * @param {object} options - Validation options
     * @returns {object} - Stage validation result
     * @private
     */
    async _runValidationStage(stage, data, options) {
        const stageResult = {
            stage,
            passed: true,
            warnings: [],
            errors: [],
            transformedData: null
        };

        try {
            switch (stage) {
                case 'structure':
                    return this._validateStructure(data, stageResult);
                
                case 'standardization':
                    return this._validateStandardization(data, stageResult);
                
                case 'dataTypes':
                    return this._validateDataTypes(data, stageResult);
                
                case 'businessRules':
                    return this._validateBusinessRules(data, stageResult);
                
                case 'facebookCapi':
                    return this._validateFacebookCapi(data, stageResult);
                
                case 'privacy':
                    return this._validatePrivacy(data, stageResult);
                
                default:
                    stageResult.errors.push(`Unknown validation stage: ${stage}`);
                    stageResult.passed = false;
            }
        } catch (error) {
            stageResult.errors.push(`Stage ${stage} error: ${error.message}`);
            stageResult.passed = false;
        }

        return stageResult;
    }

    /**
     * Validate event data structure
     * @param {object} data - Event data
     * @param {object} stageResult - Stage result object
     * @returns {object} - Updated stage result
     * @private
     */
    _validateStructure(data, stageResult) {
        const schema = Joi.object({
            event_name: Joi.string().required(),
            timestamp: Joi.date().iso().default(() => new Date()),
            user_id: Joi.string().allow(null),
            session_id: Joi.string().allow(null),
            platform: Joi.string().valid(...Object.values(PLATFORM_TYPES)),
            properties: Joi.object().default({}),
            page_url: Joi.string().uri().allow(null),
            user_agent: Joi.string().allow(null)
        }).unknown(true);

        const { error, value } = schema.validate(data);

        if (error) {
            stageResult.errors.push(`Structure validation: ${error.details[0].message}`);
            stageResult.passed = false;
        } else {
            stageResult.transformedData = value;
        }

        return stageResult;
    }

    /**
     * Validate event standardization
     * @param {object} data - Event data
     * @param {object} stageResult - Stage result object
     * @returns {object} - Updated stage result
     * @private
     */
    _validateStandardization(data, stageResult) {
        const eventName = data.event_name;
        const standardEvent = Object.values(STANDARD_EVENTS).find(
            event => event.name === eventName || event.legacy_names?.includes(eventName)
        );

        if (!standardEvent) {
            stageResult.warnings.push(`Non-standard event name: ${eventName}`);
        } else {
            // Migrate legacy event names
            if (standardEvent.legacy_names?.includes(eventName)) {
                stageResult.transformedData = {
                    ...data,
                    event_name: standardEvent.name,
                    _legacy_name: eventName
                };
                stageResult.warnings.push(`Migrated legacy event: ${eventName} -> ${standardEvent.name}`);
            }

            // Validate required properties
            const missingProps = standardEvent.required_properties?.filter(
                prop => !data.properties?.[prop] && !data[prop]
            ) || [];

            if (missingProps.length > 0) {
                stageResult.warnings.push(`Missing required properties: ${missingProps.join(', ')}`);
            }
        }

        return stageResult;
    }

    /**
     * Validate data types and formats
     * @param {object} data - Event data
     * @param {object} stageResult - Stage result object
     * @returns {object} - Updated stage result
     * @private
     */
    _validateDataTypes(data, stageResult) {
        const transformedProperties = { ...data.properties };
        
        // Validate and convert common data types
        if (transformedProperties.value !== undefined) {
            const numValue = parseFloat(transformedProperties.value);
            if (isNaN(numValue)) {
                stageResult.warnings.push('Value property is not a valid number');
            } else {
                transformedProperties.value = numValue;
            }
        }

        if (transformedProperties.currency && typeof transformedProperties.currency !== 'string') {
            stageResult.warnings.push('Currency should be a string (ISO 4217 code)');
        }

        if (transformedProperties.product_id && typeof transformedProperties.product_id !== 'string') {
            transformedProperties.product_id = String(transformedProperties.product_id);
        }

        // Validate email format
        if (transformedProperties.email && !this._isValidEmail(transformedProperties.email)) {
            stageResult.warnings.push('Invalid email format');
        }

        // Validate phone format
        if (transformedProperties.phone && !this._isValidPhone(transformedProperties.phone)) {
            stageResult.warnings.push('Invalid phone format');
        }

        if (Object.keys(transformedProperties).length !== Object.keys(data.properties || {}).length) {
            stageResult.transformedData = {
                ...data,
                properties: transformedProperties
            };
        }

        return stageResult;
    }

    /**
     * Validate business rules
     * @param {object} data - Event data
     * @param {object} stageResult - Stage result object
     * @returns {object} - Updated stage result
     * @private
     */
    _validateBusinessRules(data, stageResult) {
        const eventName = data.event_name;
        const properties = data.properties || {};

        // E-commerce validation rules
        if (eventName === 'AddToCart' || eventName === 'Purchase') {
            if (!properties.product_id && !properties.content_ids) {
                stageResult.errors.push('E-commerce events require product_id or content_ids');
                stageResult.passed = false;
            }

            if (!properties.value && !properties.price) {
                stageResult.warnings.push('E-commerce events should include value/price');
            }
        }

        // Purchase-specific rules
        if (eventName === 'Purchase') {
            if (!properties.order_id && !properties.transaction_id) {
                stageResult.warnings.push('Purchase events should include order_id');
            }

            if (properties.value && properties.value <= 0) {
                stageResult.errors.push('Purchase value must be greater than 0');
                stageResult.passed = false;
            }
        }

        // Lead generation rules
        if (eventName === 'Lead' || eventName === 'CompleteRegistration') {
            if (!properties.email && !properties.phone) {
                stageResult.warnings.push('Lead events should include contact information');
            }
        }

        return stageResult;
    }

    /**
     * Validate Facebook CAPI compatibility
     * @param {object} data - Event data
     * @param {object} stageResult - Stage result object
     * @returns {object} - Updated stage result
     * @private
     */
    _validateFacebookCapi(data, stageResult) {
        const eventName = data.event_name;
        const properties = data.properties || {};
        const facebookEvent = this.facebookCapiMapping[eventName];

        if (!facebookEvent) {
            stageResult.warnings.push(`Event ${eventName} not mapped to Facebook CAPI`);
            return stageResult;
        }

        // Check required Facebook parameters
        const missingFbParams = [];
        
        if (facebookEvent.required_params) {
            for (const param of facebookEvent.required_params) {
                const value = properties[param] || data[param];
                if (!value) {
                    missingFbParams.push(param);
                }
            }
        }

        if (missingFbParams.length > 0) {
            stageResult.warnings.push(
                `Missing Facebook CAPI parameters: ${missingFbParams.join(', ')}`
            );
        }

        // Validate user data requirements
        if (!data.user_id && !properties.email && !properties.phone) {
            stageResult.warnings.push('Facebook CAPI requires user identification (user_id, email, or phone)');
        }

        // Validate content_ids format for e-commerce events
        if (facebookEvent.category === 'ecommerce' && properties.content_ids) {
            if (!Array.isArray(properties.content_ids)) {
                stageResult.transformedData = {
                    ...data,
                    properties: {
                        ...properties,
                        content_ids: [String(properties.content_ids)]
                    }
                };
            }
        }

        return stageResult;
    }

    /**
     * Validate privacy compliance
     * @param {object} data - Event data
     * @param {object} stageResult - Stage result object
     * @returns {object} - Updated stage result
     * @private
     */
    _validatePrivacy(data, stageResult) {
        const properties = data.properties || {};
        const sensitiveFields = ['email', 'phone', 'first_name', 'last_name', 'address'];
        const transformedData = { ...data };
        const transformedProperties = { ...properties };

        for (const field of sensitiveFields) {
            if (transformedProperties[field] && !this._isHashed(transformedProperties[field])) {
                stageResult.warnings.push(`PII field '${field}' should be hashed for privacy compliance`);
            }
        }

        // Check for potential PII in custom properties
        for (const [key, value] of Object.entries(transformedProperties)) {
            if (typeof value === 'string' && this._containsPotentialPII(value)) {
                stageResult.warnings.push(`Potential PII detected in property '${key}'`);
            }
        }

        // Validate consent information
        if (!properties.consent_granted && !data.consent_granted) {
            stageResult.warnings.push('Missing user consent information');
        }

        return stageResult;
    }

    /**
     * Calculate overall quality score
     * @param {object} validationResult - Validation result
     * @returns {number} - Quality score (0-100)
     * @private
     */
    _calculateQualityScore(validationResult) {
        let score = 100;
        
        // Deduct points for errors
        score -= validationResult.errors.length * 20;
        
        // Deduct points for warnings
        score -= validationResult.warnings.length * 5;
        
        // Bonus for standardized events
        const hasStandardEvent = Object.values(STANDARD_EVENTS).some(
            event => event.name === validationResult.standardizedData.event_name
        );
        if (!hasStandardEvent) score -= 10;
        
        // Bonus for Facebook CAPI readiness
        if (this._isFacebookCapiReady(validationResult.standardizedData)) {
            score += 5;
        }
        
        // Bonus for privacy compliance
        if (this._isPrivacyCompliant(validationResult.standardizedData)) {
            score += 5;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate data completeness percentage
     * @param {object} data - Event data
     * @returns {number} - Completeness percentage (0-100)
     * @private
     */
    _calculateDataCompleteness(data) {
        const standardEvent = Object.values(STANDARD_EVENTS).find(
            event => event.name === data.event_name
        );

        if (!standardEvent) return 50; // Base score for non-standard events

        const requiredFields = standardEvent.required_properties || [];
        const availableFields = requiredFields.filter(field => 
            data.properties?.[field] || data[field]
        );

        if (requiredFields.length === 0) return 100;
        
        return Math.round((availableFields.length / requiredFields.length) * 100);
    }

    /**
     * Check if event is Facebook CAPI ready
     * @param {object} data - Event data
     * @returns {boolean} - CAPI readiness
     * @private
     */
    _isFacebookCapiReady(data) {
        const facebookEvent = this.facebookCapiMapping[data.event_name];
        if (!facebookEvent) return false;

        // Check user identification
        const hasUserData = data.user_id || data.properties?.email || data.properties?.phone;
        if (!hasUserData) return false;

        // Check required parameters
        if (facebookEvent.required_params) {
            const hasAllParams = facebookEvent.required_params.every(param => 
                data.properties?.[param] || data[param]
            );
            if (!hasAllParams) return false;
        }

        return true;
    }

    /**
     * Check privacy compliance
     * @param {object} data - Event data
     * @returns {boolean} - Privacy compliance status
     * @private
     */
    _isPrivacyCompliant(data) {
        const properties = data.properties || {};
        const sensitiveFields = ['email', 'phone', 'first_name', 'last_name'];
        
        // Check if PII is properly hashed
        for (const field of sensitiveFields) {
            if (properties[field] && !this._isHashed(properties[field])) {
                return false;
            }
        }

        // Check consent
        if (!properties.consent_granted && !data.consent_granted) {
            return false;
        }

        return true;
    }

    /**
     * Initialize validation rules
     * @returns {object} - Validation rules
     * @private
     */
    _initValidationRules() {
        return {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+?[\d\s\-\(\)]{10,}$/,
            currency: /^[A-Z]{3}$/,
            hash: /^[a-f0-9]{64}$/ // SHA-256 hash pattern
        };
    }

    /**
     * Initialize Facebook CAPI mapping
     * @returns {object} - Facebook CAPI event mapping
     * @private
     */
    _initFacebookCapiMapping() {
        return {
            'PageView': {
                fb_event: 'PageView',
                category: 'navigation',
                required_params: []
            },
            'ViewContent': {
                fb_event: 'ViewContent',
                category: 'ecommerce',
                required_params: ['content_ids', 'content_type']
            },
            'AddToCart': {
                fb_event: 'AddToCart',
                category: 'ecommerce',
                required_params: ['content_ids', 'content_type', 'value', 'currency']
            },
            'Purchase': {
                fb_event: 'Purchase',
                category: 'ecommerce',
                required_params: ['content_ids', 'content_type', 'value', 'currency']
            },
            'Lead': {
                fb_event: 'Lead',
                category: 'conversion',
                required_params: []
            },
            'CompleteRegistration': {
                fb_event: 'CompleteRegistration',
                category: 'conversion',
                required_params: []
            }
        };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Valid email
     * @private
     */
    _isValidEmail(email) {
        return this.validationRules.email.test(email);
    }

    /**
     * Validate phone format
     * @param {string} phone - Phone to validate
     * @returns {boolean} - Valid phone
     * @private
     */
    _isValidPhone(phone) {
        return this.validationRules.phone.test(phone);
    }

    /**
     * Check if string is hashed
     * @param {string} value - Value to check
     * @returns {boolean} - Is hashed
     * @private
     */
    _isHashed(value) {
        return this.validationRules.hash.test(value);
    }

    /**
     * Check for potential PII in string
     * @param {string} value - Value to check
     * @returns {boolean} - Contains potential PII
     * @private
     */
    _containsPotentialPII(value) {
        // Simple PII detection patterns
        const piiPatterns = [
            /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN pattern
            /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card pattern
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email pattern
        ];

        return piiPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Get validation pipeline statistics
     * @returns {object} - Pipeline statistics
     */
    getStats() {
        const avgQualityScore = this.qualityMetrics.qualityScores.length > 0
            ? this.qualityMetrics.qualityScores.reduce((a, b) => a + b, 0) / this.qualityMetrics.qualityScores.length
            : 0;

        return {
            ...this.qualityMetrics,
            averageQualityScore: Math.round(avgQualityScore),
            successRate: this.qualityMetrics.processed > 0
                ? Math.round((this.qualityMetrics.passed / this.qualityMetrics.processed) * 100)
                : 0
        };
    }

    /**
     * Reset validation statistics
     */
    resetStats() {
        this.qualityMetrics = {
            processed: 0,
            passed: 0,
            warnings: 0,
            errors: 0,
            qualityScores: []
        };
    }
}

// Create singleton instance
const dataValidationPipeline = new DataValidationPipeline();

module.exports = dataValidationPipeline;