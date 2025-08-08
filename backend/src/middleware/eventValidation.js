/*
File: src/middleware/eventValidation.js
- Soft validation middleware với migration support
- Enhanced logging cho event standardization
- Performance monitoring for validation process
*/
'use strict';

const { normalizeEventName, validateEventProperties } = require('../constants/eventStandards');
const logger = require('../utils/logger');

/**
 * Event Validation Middleware
 * Validates events against standardized schema với soft validation approach
 */
const eventValidation = (options = {}) => {
  const {
    mode = 'soft', // 'soft' | 'strict'
    logLevel = 'info', // 'debug' | 'info' | 'warn' | 'error'
    enableMigration = true,
    enablePerformanceTracking = true
  } = options;

  return (req, res, next) => {
    const startTime = enablePerformanceTracking ? Date.now() : null;
    
    try {
      const { eventName, properties = {} } = req.body;

      if (!eventName) {
        logger.warn('Event validation: Missing eventName in request');
        return next(); // Soft validation - continue without blocking
      }

      // Step 1: Normalize event name (migration support)
      const originalEventName = eventName;
      const standardizedEventName = normalizeEventName(eventName);
      
      if (enableMigration && originalEventName !== standardizedEventName) {
        logger.info(`Event migration: "${originalEventName}" → "${standardizedEventName}"`);
        req.body.eventName = standardizedEventName; // Update request với standardized name
      }

      // Step 2: Validate event properties
      const validation = validateEventProperties(standardizedEventName, properties);
      
      // Step 3: Attach validation results to request for downstream processing
      req.eventValidation = {
        originalName: originalEventName,
        standardizedName: standardizedEventName,
        validation: validation,
        migrated: originalEventName !== standardizedEventName,
        timestamp: new Date().toISOString()
      };

      // Step 4: Logging based on validation results
      if (validation.valid) {
        if (logLevel === 'debug') {
          logger.debug('Event validation passed:', {
            event: standardizedEventName,
            migrated: req.eventValidation.migrated,
            facebookCompatible: validation.eventDefinition?.facebook_event !== null
          });
        }
      } else {
        // Log validation errors
        logger.warn('Event validation issues:', {
          event: standardizedEventName,
          errors: validation.errors,
          warnings: validation.warnings,
          mode: mode
        });

        // In strict mode, block invalid events
        if (mode === 'strict') {
          return res.status(400).json({
            success: false,
            error: 'Event validation failed',
            details: {
              event: standardizedEventName,
              errors: validation.errors,
              warnings: validation.warnings
            }
          });
        }
      }

      // Step 5: Log warnings (non-blocking)
      if (validation.warnings && validation.warnings.length > 0) {
        logger.warn('Event validation warnings:', {
          event: standardizedEventName,
          warnings: validation.warnings
        });
      }

      // Step 6: Performance tracking
      if (enablePerformanceTracking) {
        const processingTime = Date.now() - startTime;
        if (processingTime > 50) { // Log slow validations
          logger.warn(`Slow event validation: ${processingTime}ms for event ${standardizedEventName}`);
        }
        
        req.eventValidation.processingTime = processingTime;
      }

      // Step 7: Continue with request processing
      next();

    } catch (error) {
      logger.error('Event validation middleware error:', error);
      
      // In soft mode, continue despite errors
      if (mode === 'soft') {
        req.eventValidation = {
          error: error.message,
          timestamp: new Date().toISOString()
        };
        return next();
      }
      
      // In strict mode, return error
      return res.status(500).json({
        success: false,
        error: 'Event validation error',
        details: error.message
      });
    }
  };
};

/**
 * Quality metrics collector middleware
 * Collect metrics về event quality cho monitoring dashboard
 */
const qualityMetricsCollector = (req, res, next) => {
  // Gắn response hook để collect metrics sau khi xử lý xong
  const originalSend = res.send;
  
  res.send = function(data) {
    // Collect metrics if event validation was performed
    if (req.eventValidation) {
      const metrics = {
        timestamp: new Date(),
        event: req.eventValidation.standardizedName || 'unknown',
        original_event: req.eventValidation.originalName || 'unknown',
        migrated: req.eventValidation.migrated || false,
        valid: req.eventValidation.validation?.valid || false,
        errors_count: req.eventValidation.validation?.errors?.length || 0,
        warnings_count: req.eventValidation.validation?.warnings?.length || 0,
        processing_time: req.eventValidation.processingTime || 0,
        facebook_compatible: req.eventValidation.validation?.eventDefinition?.facebook_event !== null,
        response_status: res.statusCode,
        api_key: req.body?.apiKey || 'unknown'
      };

      // Log metrics cho monitoring systems
      logger.info('Event quality metrics:', metrics);

      // TODO: Store metrics trong database hoặc send to monitoring service
      // Có thể implement Bull queue để xử lý metrics asynchronously
    }

    // Call original send method
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Event enrichment middleware
 * Enrich event data với standardized properties
 */
const eventEnrichment = (req, res, next) => {
  try {
    if (!req.eventValidation || !req.body.properties) {
      return next();
    }

    const { standardizedName, validation } = req.eventValidation;
    const eventDef = validation?.eventDefinition;

    if (eventDef) {
      // Add standardized metadata
      req.body.properties._loomsky = {
        event_category: eventDef.category,
        facebook_event: eventDef.facebook_event,
        standardized_name: standardizedName,
        validation_passed: validation.valid,
        enriched_at: new Date().toISOString()
      };

      // Add Facebook CAPI metadata if compatible
      if (eventDef.facebook_event) {
        req.body.properties._facebook_capi = {
          event_name: eventDef.facebook_event,
          ready_for_capi: true,
          required_fields_present: validation.valid
        };
      }
    }

    next();
  } catch (error) {
    logger.error('Event enrichment error:', error);
    next(); // Continue despite enrichment errors
  }
};

module.exports = {
  eventValidation,
  qualityMetricsCollector,
  eventEnrichment
};