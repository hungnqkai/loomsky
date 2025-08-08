/*
File: src/controllers/qualityController.js
Quality metrics and data validation controller for LoomSky
- Real-time quality monitoring
- Performance metrics tracking
- Quality alerts management
- Data validation reporting
*/
'use strict';

const dataValidationPipeline = require('../validators/dataValidationPipeline');
const performanceMonitor = require('../utils/performanceMonitor');
const { Event, Website } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get quality metrics for a website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQualityMetrics = async (req, res) => {
    try {
        const { websiteId } = req.params;
        const { timeWindow = 60 } = req.query; // minutes
        
        const website = await Website.findByPk(websiteId);
        if (!website) {
            return res.status(404).json({
                success: false,
                error: 'Website not found'
            });
        }

        const cutoffTime = new Date(Date.now() - (timeWindow * 60 * 1000));

        // Get recent events for analysis
        const recentEvents = await Event.findAll({
            where: {
                website_id: websiteId,
                created_at: {
                    [Op.gte]: cutoffTime
                }
            },
            order: [['created_at', 'DESC']],
            limit: 1000
        });

        // Calculate quality metrics
        const metrics = await calculateQualityMetrics(recentEvents);
        const pipelineStats = dataValidationPipeline.getStats();

        const qualityData = {
            website_id: websiteId,
            time_window: timeWindow,
            timestamp: new Date().toISOString(),
            
            // Event metrics
            total_events: recentEvents.length,
            events_per_minute: recentEvents.length / timeWindow,
            
            // Standardization metrics
            standardization_score: metrics.standardizationScore,
            standard_events_ratio: metrics.standardEventsRatio,
            legacy_events_count: metrics.legacyEventsCount,
            
            // Data quality metrics
            data_completeness_score: metrics.dataCompletenessScore,
            validation_success_rate: pipelineStats.successRate,
            average_quality_score: pipelineStats.averageQualityScore,
            
            // Facebook CAPI readiness
            facebook_capi_score: metrics.facebookCapiScore,
            capi_ready_events: metrics.capiReadyEvents,
            
            // Privacy compliance
            privacy_compliance_score: metrics.privacyScore,
            pii_issues_count: metrics.piiIssuesCount,
            
            // Error and warning tracking
            validation_errors: pipelineStats.errors,
            validation_warnings: pipelineStats.warnings,
            
            // Performance indicators
            avg_processing_time: performanceMonitor.getStats('eventProcessing', timeWindow).averageDuration,
            performance_alerts: performanceMonitor.getAlerts(true).length,
            
            // Quality trends
            quality_trend: await calculateQualityTrend(websiteId, timeWindow),
            event_distribution: await calculateEventDistribution(recentEvents)
        };

        res.json({
            success: true,
            data: qualityData
        });

    } catch (error) {
        logger.error('Get quality metrics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve quality metrics'
        });
    }
};

/**
 * Get performance metrics for a website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPerformanceMetrics = async (req, res) => {
    try {
        const { websiteId } = req.params;
        const { timeWindow = 60 } = req.query;

        const website = await Website.findByPk(websiteId);
        if (!website) {
            return res.status(404).json({
                success: false,
                error: 'Website not found'
            });
        }

        const performanceStats = performanceMonitor.getStats('eventProcessing', timeWindow);
        const systemMetrics = performanceMonitor.getSystemMetrics();
        const validationStats = performanceMonitor.getStats('dataValidation', timeWindow);

        const performanceData = {
            website_id: websiteId,
            time_window: timeWindow,
            timestamp: new Date().toISOString(),
            
            // Processing performance
            event_processing: {
                average_duration: performanceStats.averageDuration,
                min_duration: performanceStats.minDuration,
                max_duration: performanceStats.maxDuration,
                p95_duration: performanceStats.p95Duration,
                p99_duration: performanceStats.p99Duration,
                throughput: performanceStats.throughput,
                error_rate: performanceStats.errorRate
            },
            
            // Validation performance
            data_validation: {
                average_duration: validationStats.averageDuration,
                min_duration: validationStats.minDuration,
                max_duration: validationStats.maxDuration,
                throughput: validationStats.throughput,
                error_rate: validationStats.errorRate
            },
            
            // System metrics
            system: {
                memory_usage: systemMetrics.memory,
                cpu_usage: systemMetrics.cpu,
                uptime: systemMetrics.uptime,
                event_loop_lag: systemMetrics.eventLoop.lag,
                active_timers: systemMetrics.activeTimers,
                total_metrics: systemMetrics.totalMetrics
            },
            
            // Performance health indicators
            health_score: calculatePerformanceHealthScore(performanceStats, systemMetrics),
            bottlenecks: identifyBottlenecks(performanceStats, validationStats),
            recommendations: generatePerformanceRecommendations(performanceStats, systemMetrics)
        };

        res.json({
            success: true,
            data: performanceData
        });

    } catch (error) {
        logger.error('Get performance metrics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve performance metrics'
        });
    }
};

/**
 * Get quality alerts for a website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQualityAlerts = async (req, res) => {
    try {
        const { websiteId } = req.params;
        const { activeOnly = true } = req.query;

        const website = await Website.findByPk(websiteId);
        if (!website) {
            return res.status(404).json({
                success: false,
                error: 'Website not found'
            });
        }

        // Get performance alerts
        const performanceAlerts = performanceMonitor.getAlerts(activeOnly === 'true');
        
        // Get validation pipeline alerts (mock implementation)
        const validationAlerts = await generateValidationAlerts(websiteId, activeOnly === 'true');
        
        // Combine and format alerts
        const allAlerts = [
            ...performanceAlerts.map(alert => ({
                ...alert,
                category: 'performance',
                website_id: websiteId
            })),
            ...validationAlerts.map(alert => ({
                ...alert,
                category: 'validation',
                website_id: websiteId
            }))
        ];

        // Sort by severity and timestamp
        allAlerts.sort((a, b) => {
            const severityOrder = { critical: 3, warning: 2, info: 1 };
            const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            
            if (severityDiff !== 0) return severityDiff;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        res.json({
            success: true,
            data: {
                alerts: allAlerts,
                summary: {
                    total: allAlerts.length,
                    critical: allAlerts.filter(a => a.severity === 'critical').length,
                    warning: allAlerts.filter(a => a.severity === 'warning').length,
                    info: allAlerts.filter(a => a.severity === 'info').length,
                    active: allAlerts.filter(a => a.active).length
                }
            }
        });

    } catch (error) {
        logger.error('Get quality alerts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve quality alerts'
        });
    }
};

/**
 * Get event distribution for a website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEventDistribution = async (req, res) => {
    try {
        const { websiteId } = req.params;
        const { timeWindow = 60 } = req.query;

        const website = await Website.findByPk(websiteId);
        if (!website) {
            return res.status(404).json({
                success: false,
                error: 'Website not found'
            });
        }

        const cutoffTime = new Date(Date.now() - (timeWindow * 60 * 1000));

        const events = await Event.findAll({
            where: {
                website_id: websiteId,
                created_at: {
                    [Op.gte]: cutoffTime
                }
            },
            attributes: ['event_name', 'created_at', 'properties'],
            order: [['created_at', 'DESC']]
        });

        const distribution = await calculateEventDistribution(events);

        res.json({
            success: true,
            data: {
                website_id: websiteId,
                time_window: timeWindow,
                total_events: events.length,
                distribution
            }
        });

    } catch (error) {
        logger.error('Get event distribution error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve event distribution'
        });
    }
};

/**
 * Get data source health for a website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDataSourceHealth = async (req, res) => {
    try {
        const { websiteId } = req.params;

        const website = await Website.findByPk(websiteId);
        if (!website) {
            return res.status(404).json({
                success: false,
                error: 'Website not found'
            });
        }

        // Analyze different time windows for health assessment
        const timeWindows = [5, 15, 60]; // minutes
        const healthData = {};

        for (const window of timeWindows) {
            const cutoffTime = new Date(Date.now() - (window * 60 * 1000));
            
            const eventCount = await Event.count({
                where: {
                    website_id: websiteId,
                    created_at: {
                        [Op.gte]: cutoffTime
                    }
                }
            });

            healthData[`${window}m`] = {
                event_count: eventCount,
                events_per_minute: eventCount / window,
                status: eventCount > 0 ? 'healthy' : 'no_data'
            };
        }

        // Overall health assessment
        const overallStatus = healthData['5m'].status === 'healthy' ? 'healthy' :
                           healthData['15m'].status === 'healthy' ? 'degraded' :
                           healthData['60m'].status === 'healthy' ? 'recovering' : 'offline';

        res.json({
            success: true,
            data: {
                website_id: websiteId,
                overall_status: overallStatus,
                timestamp: new Date().toISOString(),
                time_windows: healthData,
                recommendations: generateHealthRecommendations(overallStatus, healthData)
            }
        });

    } catch (error) {
        logger.error('Get data source health error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve data source health'
        });
    }
};

/**
 * Acknowledge a quality alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const acknowledgeAlert = async (req, res) => {
    try {
        const { websiteId, alertId } = req.params;

        const website = await Website.findByPk(websiteId);
        if (!website) {
            return res.status(404).json({
                success: false,
                error: 'Website not found'
            });
        }

        // In a real implementation, you would update the alert in a database
        // For now, we'll just log the acknowledgment
        logger.info(`Alert ${alertId} acknowledged for website ${websiteId}`);

        res.json({
            success: true,
            data: {
                alert_id: alertId,
                website_id: websiteId,
                acknowledged: true,
                acknowledged_at: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Acknowledge alert error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge alert'
        });
    }
};

// Helper functions

/**
 * Calculate quality metrics from events
 * @param {Array} events - Array of events
 * @returns {Object} - Quality metrics
 */
async function calculateQualityMetrics(events) {
    const metrics = {
        standardizationScore: 0,
        standardEventsRatio: 0,
        legacyEventsCount: 0,
        dataCompletenessScore: 0,
        facebookCapiScore: 0,
        capiReadyEvents: 0,
        privacyScore: 0,
        piiIssuesCount: 0
    };

    if (events.length === 0) return metrics;

    // Analyze each event through validation pipeline
    let totalQualityScore = 0;
    let standardEvents = 0;
    let capiReady = 0;
    let privacyCompliant = 0;

    for (const event of events) {
        const validationResult = await dataValidationPipeline.validateEventData({
            event_name: event.event_name,
            properties: event.properties || {},
            timestamp: event.created_at,
            user_id: event.user_id,
            session_id: event.session_id
        });

        totalQualityScore += validationResult.quality_score;
        
        if (validationResult.metadata.facebookCapiReady) {
            capiReady++;
        }
        
        if (validationResult.metadata.privacyCompliant) {
            privacyCompliant++;
        }

        // Check if it's a standard event
        if (validationResult.standardizedData.event_name !== event.event_name) {
            metrics.legacyEventsCount++;
        } else {
            standardEvents++;
        }
    }

    metrics.standardizationScore = Math.round(totalQualityScore / events.length);
    metrics.standardEventsRatio = Math.round((standardEvents / events.length) * 100);
    metrics.dataCompletenessScore = Math.round(totalQualityScore / events.length);
    metrics.facebookCapiScore = Math.round((capiReady / events.length) * 100);
    metrics.capiReadyEvents = capiReady;
    metrics.privacyScore = Math.round((privacyCompliant / events.length) * 100);

    return metrics;
}

/**
 * Calculate quality trend over time
 * @param {string} websiteId - Website ID
 * @param {number} timeWindow - Time window in minutes
 * @returns {Object} - Quality trend data
 */
async function calculateQualityTrend(websiteId, timeWindow) {
    // This is a simplified implementation
    // In a real system, you would store historical quality scores
    return {
        direction: 'stable', // up, down, stable
        change_percentage: 0,
        trend_points: []
    };
}

/**
 * Calculate event distribution
 * @param {Array} events - Array of events
 * @returns {Object} - Event distribution data
 */
async function calculateEventDistribution(events) {
    const distribution = {};
    const totalEvents = events.length;

    events.forEach(event => {
        const eventName = event.event_name;
        if (!distribution[eventName]) {
            distribution[eventName] = {
                count: 0,
                percentage: 0,
                recent: []
            };
        }
        distribution[eventName].count++;
        distribution[eventName].recent.push(event.created_at);
    });

    // Calculate percentages and limit recent events
    Object.keys(distribution).forEach(eventName => {
        const eventData = distribution[eventName];
        eventData.percentage = Math.round((eventData.count / totalEvents) * 100);
        eventData.recent = eventData.recent.slice(-10); // Keep last 10 timestamps
    });

    return distribution;
}

/**
 * Calculate performance health score
 * @param {Object} performanceStats - Performance statistics
 * @param {Object} systemMetrics - System metrics
 * @returns {number} - Health score (0-100)
 */
function calculatePerformanceHealthScore(performanceStats, systemMetrics) {
    let score = 100;

    // Deduct for slow processing
    if (performanceStats.averageDuration > 200) score -= 20;
    if (performanceStats.p95Duration > 500) score -= 15;

    // Deduct for high error rate
    if (performanceStats.errorRate > 5) score -= 25;
    if (performanceStats.errorRate > 10) score -= 25;

    // Deduct for high memory usage
    if (systemMetrics.memory.heapUsed > 500) score -= 15;
    if (systemMetrics.memory.heapUsed > 1000) score -= 15;

    // Deduct for high event loop lag
    if (systemMetrics.eventLoop.lag > 10) score -= 10;
    if (systemMetrics.eventLoop.lag > 50) score -= 20;

    return Math.max(0, score);
}

/**
 * Identify performance bottlenecks
 * @param {Object} performanceStats - Performance statistics
 * @param {Object} validationStats - Validation statistics
 * @returns {Array} - Array of identified bottlenecks
 */
function identifyBottlenecks(performanceStats, validationStats) {
    const bottlenecks = [];

    if (performanceStats.averageDuration > 200) {
        bottlenecks.push({
            type: 'slow_processing',
            severity: 'warning',
            description: 'Event processing is slower than expected',
            metric: `${performanceStats.averageDuration.toFixed(2)}ms average`
        });
    }

    if (validationStats.averageDuration > 50) {
        bottlenecks.push({
            type: 'slow_validation',
            severity: 'info',
            description: 'Data validation is taking longer than optimal',
            metric: `${validationStats.averageDuration.toFixed(2)}ms average`
        });
    }

    if (performanceStats.errorRate > 5) {
        bottlenecks.push({
            type: 'high_error_rate',
            severity: 'critical',
            description: 'High error rate detected in event processing',
            metric: `${performanceStats.errorRate.toFixed(1)}% error rate`
        });
    }

    return bottlenecks;
}

/**
 * Generate performance recommendations
 * @param {Object} performanceStats - Performance statistics
 * @param {Object} systemMetrics - System metrics
 * @returns {Array} - Array of recommendations
 */
function generatePerformanceRecommendations(performanceStats, systemMetrics) {
    const recommendations = [];

    if (performanceStats.averageDuration > 200) {
        recommendations.push({
            priority: 'high',
            action: 'optimize_processing',
            description: 'Consider optimizing event processing pipeline',
            impact: 'Faster response times and better user experience'
        });
    }

    if (systemMetrics.memory.heapUsed > 500) {
        recommendations.push({
            priority: 'medium',
            action: 'memory_optimization',
            description: 'Review memory usage and implement cleanup procedures',
            impact: 'Reduced memory footprint and improved stability'
        });
    }

    if (performanceStats.throughput < 10) {
        recommendations.push({
            priority: 'low',
            action: 'scale_resources',
            description: 'Consider scaling resources for higher throughput',
            impact: 'Better handling of peak traffic'
        });
    }

    return recommendations;
}

/**
 * Generate validation alerts
 * @param {string} websiteId - Website ID
 * @param {boolean} activeOnly - Return only active alerts
 * @returns {Array} - Array of validation alerts
 */
async function generateValidationAlerts(websiteId, activeOnly) {
    // This is a mock implementation
    // In a real system, you would store and retrieve actual alerts
    const mockAlerts = [
        {
            id: `val_${websiteId}_${Date.now()}`,
            type: 'data_quality',
            message: 'High number of events with missing required properties',
            severity: 'warning',
            timestamp: new Date().toISOString(),
            active: true,
            acknowledged: false,
            data: {
                missing_properties: ['product_id', 'value'],
                affected_events: 15
            }
        }
    ];

    return activeOnly ? mockAlerts.filter(alert => alert.active) : mockAlerts;
}

/**
 * Generate health recommendations
 * @param {string} status - Overall health status
 * @param {Object} healthData - Health data
 * @returns {Array} - Array of recommendations
 */
function generateHealthRecommendations(status, healthData) {
    const recommendations = [];

    if (status === 'offline') {
        recommendations.push({
            priority: 'critical',
            action: 'check_integration',
            description: 'No data received in the last hour. Check SDK integration.',
            impact: 'Data collection is not working'
        });
    } else if (status === 'degraded') {
        recommendations.push({
            priority: 'high',
            action: 'investigate_issues',
            description: 'Data flow has decreased. Check for errors or blocking issues.',
            impact: 'Reduced data quality and insights'
        });
    }

    return recommendations;
}

module.exports = {
    getQualityMetrics,
    getPerformanceMetrics,
    getQualityAlerts,
    getEventDistribution,
    getDataSourceHealth,
    acknowledgeAlert
};