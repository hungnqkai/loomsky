/*
File: src/controllers/trackController.js (UPDATED)
- Controller chứa logic nghiệp vụ cốt lõi để xử lý sự kiện.
- Enhanced với event standardization và validation
- Performance monitoring và quality metrics
*/
'use strict';
const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { getEventDefinition, isFacebookCompatible } = require('../constants/eventStandards');
const dataValidationPipeline = require('../validators/dataValidationPipeline');
const performanceMonitor = require('../utils/performanceMonitor');
const logger = require('../utils/logger');

const trackController = {
    /**
     * @desc    Receive and process a tracking event from the SDK
     * @route   POST /api/v1/track/event
     * @access  Public (via API Key)
     */
    trackEvent: asyncHandler(async (req, res) => {
        const trackingTimerId = performanceMonitor.startTimer('eventProcessing', {
            eventName: req.body.eventName,
            apiKey: req.body.apiKey?.substring(0, 8) + '...'
        });
        
        const trackingStartTime = Date.now();
        const { apiKey, eventName, properties, sessionId, timestamp, pixel_id, event_id } = req.body;

        // Run comprehensive data validation pipeline
        const validationResult = await dataValidationPipeline.validateEventData({
            event_name: eventName,
            properties: properties || {},
            timestamp: timestamp || new Date().toISOString(),
            user_id: properties?.user?.ls_user_id,
            session_id: sessionId,
            platform: properties?.platform || 'unknown',
            page_url: properties?.context?.page_url,
            user_agent: req.get('user-agent')
        });

        // Enhanced logging với comprehensive validation info
        const validationInfo = req.eventValidation || {};
        logger.info('Processing event with validation pipeline:', {
            originalEvent: validationInfo.originalName || eventName,
            standardizedEvent: validationInfo.standardizedName || eventName,
            qualityScore: validationResult.quality_score,
            isValid: validationResult.isValid,
            warnings: validationResult.warnings.length,
            errors: validationResult.errors.length,
            facebookCapiReady: validationResult.metadata.facebookCapiReady,
            privacyCompliant: validationResult.metadata.privacyCompliant,
            apiKey: apiKey?.substring(0, 8) + '...'
        });

        // Log validation issues if any
        if (validationResult.warnings.length > 0) {
            logger.warn('Event validation warnings:', {
                eventName: eventName,
                warnings: validationResult.warnings
            });
        }

        if (validationResult.errors.length > 0) {
            logger.error('Event validation errors:', {
                eventName: eventName,
                errors: validationResult.errors
            });
        }

        // 1. Xác thực API Key và lấy thông tin website
        const website = await models.Website.findOne({
            where: { api_key: apiKey },
            include: {
                model: models.Client,
                attributes: ['id'],
                include: {
                    model: models.Subscription,
                    as: 'activeSubscription',
                    include: {
                        model: models.SubscriptionPlan,
                        as: 'plan',
                        attributes: ['features']
                    }
                }
            }
        });

        if (!website) {
            logger.warn('Invalid API key used in tracking request:', { apiKey: apiKey?.substring(0, 8) + '...' });
            throw new AppError('Invalid API Key.', 403);
        }

        // 2. Lớp 2: Kiểm tra Giới hạn Gói cước (Usage Limit Check)
        const monthlyLimit = website.Client?.activeSubscription?.plan?.features?.capi?.monthly_limit || 0;
        // Logic đếm số sự kiện trong tháng sẽ được thêm ở đây.
        // Nếu vượt quá, throw new AppError('Usage limit exceeded.', 429);
        
        // 3. Xử lý Session: Tìm hoặc tạo mới
        const [session, isNewSession] = await models.Session.findOrCreate({
            where: { id: sessionId },
            defaults: {
                id: sessionId,
                website_id: website.id,
                ls_user_id: properties.user.ls_user_id,
                start_time: timestamp,
                end_time: timestamp, // Sẽ được cập nhật sau
                ip_address: req.ip,
                device_info: { userAgent: properties.user.user_agent },
                attribution_source: {}, // Sẽ được làm giàu sau
                landing_page: properties.context.page_url,
            }
        });

        if (!isNewSession) {
            // Cập nhật thời gian kết thúc của session
            session.end_time = timestamp;
            await session.save();
        }

        // 4. Lưu Sự kiện với standardized and validated data
        const finalEventName = validationResult.standardizedData.event_name || eventName;
        const finalProperties = validationResult.standardizedData.properties || properties;
        const eventDefinition = getEventDefinition(finalEventName);
        const facebookCompatible = isFacebookCompatible(finalEventName);
        
        const eventRecord = await models.Event.create({
            session_id: session.id,
            event_name: finalEventName, // Use validated/standardized event name
            properties: finalProperties, // Use validated/enriched properties
            timestamp: timestamp,
            // Enhanced metadata with validation pipeline results
            metadata: {
                standardized: true,
                original_name: validationInfo.originalName || eventName,
                facebook_compatible: facebookCompatible,
                validation_passed: validationResult.isValid,
                quality_score: validationResult.quality_score,
                data_completeness: validationResult.metadata.dataCompleteness,
                facebook_capi_ready: validationResult.metadata.facebookCapiReady,
                privacy_compliant: validationResult.metadata.privacyCompliant,
                category: eventDefinition?.category || 'unknown',
                processing_time: Date.now() - trackingStartTime,
                validation_warnings: validationResult.warnings,
                validation_errors: validationResult.errors,
                // Store validation stage results for debugging
                validation_stages: validationResult.metadata.validationStages
            }
        });

        // 5. Enhanced Facebook CAPI queue logic with validation pipeline data
        if (facebookCompatible && validationResult.metadata.facebookCapiReady) {
            logger.debug('High-quality event queued for Facebook CAPI processing:', {
                eventId: eventRecord.id,
                eventName: finalEventName,
                facebookEvent: eventDefinition?.facebook_event,
                qualityScore: validationResult.quality_score,
                capiReady: true
            });
            // Future: Prioritize high-quality events in queue processing
        } else if (facebookCompatible && !validationResult.metadata.facebookCapiReady) {
            logger.warn('Facebook compatible event not CAPI ready:', {
                eventName: finalEventName,
                missingData: validationResult.warnings.filter(w => w.includes('Facebook CAPI'))
            });
        }
        
        // 6. Performance monitoring and alerting
        const totalProcessingTime = Date.now() - trackingStartTime;
        
        // End performance monitoring
        performanceMonitor.endTimer(trackingTimerId, {
            success: validationResult.isValid,
            qualityScore: validationResult.quality_score,
            warnings: validationResult.warnings.length,
            errors: validationResult.errors.length,
            eventId: eventRecord.id
        });

        if (totalProcessingTime > 200) {
            logger.warn('Slow event processing detected:', {
                eventName: finalEventName,
                processingTime: totalProcessingTime,
                sessionId: sessionId,
                qualityScore: validationResult.quality_score
            });
        }

        // 7. Enhanced response with validation and quality data
        const responseStatus = validationResult.isValid ? 202 : 
                              validationResult.errors.length > 0 ? 400 : 202;

        res.status(responseStatus).json({ 
            success: validationResult.isValid,
            message: validationResult.isValid ? 'Event accepted.' : 'Event processed with validation issues.',
            eventId: eventRecord.id,
            validation: {
                passed: validationResult.isValid,
                quality_score: validationResult.quality_score,
                data_completeness: validationResult.metadata.dataCompleteness,
                facebook_capi_ready: validationResult.metadata.facebookCapiReady,
                privacy_compliant: validationResult.metadata.privacyCompliant,
                warnings: validationResult.warnings,
                errors: validationResult.errors
            },
            standardization: {
                original_name: eventName,
                standardized_name: finalEventName,
                migrated: finalEventName !== eventName
            },
            performance: {
                processing_time: totalProcessingTime
            }
        });
    }),
};

module.exports = trackController;