/*
File: src/utils/performanceMonitor.js
- Performance tracking cho data processing
- Real-time metrics collection và analysis
- Performance alerts và bottleneck detection
*/
'use strict';

const logger = require('./logger');

/**
 * Performance Monitor cho LoomSky data processing
 * Tracks processing times, memory usage, và system performance
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.timers = new Map();
        this.alerts = [];
        this.thresholds = {
            eventProcessing: 200, // ms
            dataValidation: 50,   // ms
            databaseQuery: 100,   // ms
            apiResponse: 500,     // ms
            memoryUsage: 500      // MB
        };
        this.isEnabled = process.env.NODE_ENV !== 'test';
        
        // Initialize system monitoring
        this._initSystemMonitoring();
    }

    /**
     * Start timing an operation
     * @param {string} operation - Operation name
     * @param {object} metadata - Additional metadata
     * @returns {string} - Timer ID
     */
    startTimer(operation, metadata = {}) {
        if (!this.isEnabled) return null;
        
        const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.timers.set(timerId, {
            operation,
            startTime: process.hrtime.bigint(),
            startMemory: process.memoryUsage(),
            metadata
        });
        
        return timerId;
    }

    /**
     * End timing an operation
     * @param {string} timerId - Timer ID from startTimer
     * @param {object} additionalData - Additional data to track
     * @returns {object} - Performance result
     */
    endTimer(timerId, additionalData = {}) {
        if (!this.isEnabled || !timerId) return null;
        
        const timer = this.timers.get(timerId);
        if (!timer) {
            logger.warn(`Performance timer not found: ${timerId}`);
            return null;
        }

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - timer.startTime) / 1000000; // Convert to milliseconds

        const result = {
            operation: timer.operation,
            duration,
            memory: {
                heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
                heapTotal: endMemory.heapTotal,
                external: endMemory.external - timer.startMemory.external
            },
            timestamp: new Date().toISOString(),
            metadata: { ...timer.metadata, ...additionalData }
        };

        // Store metric
        this._storeMetric(timer.operation, result);
        
        // Check for performance issues
        this._checkPerformanceAlerts(result);
        
        // Cleanup timer
        this.timers.delete(timerId);
        
        return result;
    }

    /**
     * Track a simple metric without timing
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     * @param {string} unit - Value unit (ms, bytes, count, etc.)
     * @param {object} metadata - Additional metadata
     */
    trackMetric(name, value, unit = 'count', metadata = {}) {
        if (!this.isEnabled) return;
        
        const metric = {
            name,
            value,
            unit,
            timestamp: new Date().toISOString(),
            metadata
        };

        this._storeMetric(name, metric);
    }

    /**
     * Get performance statistics for an operation
     * @param {string} operation - Operation name
     * @param {number} timeWindow - Time window in minutes (default: 60)
     * @returns {object} - Statistics
     */
    getStats(operation, timeWindow = 60) {
        if (!this.metrics.has(operation)) {
            return {
                operation,
                count: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                p95Duration: 0,
                p99Duration: 0,
                errorRate: 0,
                throughput: 0
            };
        }

        const now = new Date();
        const cutoff = new Date(now.getTime() - (timeWindow * 60 * 1000));
        
        const recentMetrics = this.metrics.get(operation)
            .filter(metric => new Date(metric.timestamp) >= cutoff)
            .sort((a, b) => a.duration - b.duration);

        if (recentMetrics.length === 0) {
            return { operation, count: 0 };
        }

        const durations = recentMetrics.map(m => m.duration);
        const errors = recentMetrics.filter(m => m.metadata.error).length;
        
        return {
            operation,
            count: recentMetrics.length,
            averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            p95Duration: this._percentile(durations, 95),
            p99Duration: this._percentile(durations, 99),
            errorRate: (errors / recentMetrics.length) * 100,
            throughput: recentMetrics.length / timeWindow, // per minute
            memoryImpact: {
                averageHeapUsed: recentMetrics.reduce((sum, m) => sum + (m.memory?.heapUsed || 0), 0) / recentMetrics.length,
                maxHeapUsed: Math.max(...recentMetrics.map(m => m.memory?.heapUsed || 0))
            }
        };
    }

    /**
     * Get all performance alerts
     * @param {boolean} activeOnly - Return only active alerts
     * @returns {Array} - Performance alerts
     */
    getAlerts(activeOnly = true) {
        if (activeOnly) {
            return this.alerts.filter(alert => alert.active);
        }
        return [...this.alerts];
    }

    /**
     * Get system performance overview
     * @returns {object} - System performance metrics
     */
    getSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        return {
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024), // MB
                rss: Math.round(memUsage.rss / 1024 / 1024) // MB
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: Math.round(process.uptime()),
            eventLoop: {
                lag: this._getEventLoopLag()
            },
            activeTimers: this.timers.size,
            totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0)
        };
    }

    /**
     * Clean old metrics to prevent memory leaks
     * @param {number} maxAge - Maximum age in hours (default: 24)
     */
    cleanOldMetrics(maxAge = 24) {
        const cutoff = new Date(Date.now() - (maxAge * 60 * 60 * 1000));
        let cleaned = 0;
        
        for (const [operation, metrics] of this.metrics.entries()) {
            const filtered = metrics.filter(metric => new Date(metric.timestamp) >= cutoff);
            this.metrics.set(operation, filtered);
            cleaned += metrics.length - filtered.length;
        }

        if (cleaned > 0) {
            logger.info(`Performance monitor cleaned ${cleaned} old metrics`);
        }
    }

    /**
     * Store metric data
     * @param {string} operation - Operation name
     * @param {object} metric - Metric data
     * @private
     */
    _storeMetric(operation, metric) {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        
        const metrics = this.metrics.get(operation);
        metrics.push(metric);
        
        // Keep only last 1000 metrics per operation to prevent memory issues
        if (metrics.length > 1000) {
            metrics.shift();
        }
    }

    /**
     * Check for performance alerts
     * @param {object} result - Performance result
     * @private
     */
    _checkPerformanceAlerts(result) {
        const operation = result.operation;
        const duration = result.duration;
        
        // Check duration thresholds
        const threshold = this.thresholds[operation] || this.thresholds.eventProcessing;
        
        if (duration > threshold) {
            this._createAlert('slow_operation', {
                operation,
                duration,
                threshold,
                severity: duration > threshold * 2 ? 'critical' : 'warning'
            });
        }

        // Check memory usage
        const heapUsedMB = result.memory.heapTotal / 1024 / 1024;
        if (heapUsedMB > this.thresholds.memoryUsage) {
            this._createAlert('high_memory', {
                operation,
                memoryUsage: heapUsedMB,
                threshold: this.thresholds.memoryUsage,
                severity: heapUsedMB > this.thresholds.memoryUsage * 1.5 ? 'critical' : 'warning'
            });
        }
    }

    /**
     * Create performance alert
     * @param {string} type - Alert type
     * @param {object} data - Alert data
     * @private
     */
    _createAlert(type, data) {
        const alert = {
            id: `${type}_${Date.now()}`,
            type,
            message: this._formatAlertMessage(type, data),
            severity: data.severity || 'warning',
            timestamp: new Date().toISOString(),
            data,
            active: true
        };

        this.alerts.push(alert);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }

        // Log alert
        const logLevel = data.severity === 'critical' ? 'error' : 'warn';
        logger[logLevel](`Performance Alert [${type}]: ${alert.message}`, data);
    }

    /**
     * Format alert message
     * @param {string} type - Alert type
     * @param {object} data - Alert data
     * @returns {string} - Formatted message
     * @private
     */
    _formatAlertMessage(type, data) {
        switch (type) {
            case 'slow_operation':
                return `Slow ${data.operation}: ${data.duration.toFixed(2)}ms (threshold: ${data.threshold}ms)`;
            case 'high_memory':
                return `High memory usage in ${data.operation}: ${data.memoryUsage.toFixed(1)}MB (threshold: ${data.threshold}MB)`;
            default:
                return `Performance alert: ${type}`;
        }
    }

    /**
     * Calculate percentile
     * @param {Array} values - Sorted array of values
     * @param {number} percentile - Percentile (0-100)
     * @returns {number} - Percentile value
     * @private
     */
    _percentile(values, percentile) {
        if (values.length === 0) return 0;
        
        const index = Math.ceil(values.length * percentile / 100) - 1;
        return values[Math.max(0, Math.min(index, values.length - 1))];
    }

    /**
     * Get event loop lag (simplified)
     * @returns {number} - Event loop lag in ms
     * @private
     */
    _getEventLoopLag() {
        const start = process.hrtime.bigint();
        setImmediate(() => {
            const lag = Number(process.hrtime.bigint() - start) / 1000000;
            this.lastEventLoopLag = lag;
        });
        return this.lastEventLoopLag || 0;
    }

    /**
     * Initialize system monitoring
     * @private
     */
    _initSystemMonitoring() {
        // Clean old metrics periodically
        setInterval(() => {
            this.cleanOldMetrics(24);
        }, 60 * 60 * 1000); // Every hour

        // Monitor system resources
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
            
            if (heapUsedMB > this.thresholds.memoryUsage) {
                this._createAlert('system_memory', {
                    memoryUsage: heapUsedMB,
                    threshold: this.thresholds.memoryUsage,
                    severity: heapUsedMB > this.thresholds.memoryUsage * 1.5 ? 'critical' : 'warning'
                });
            }
        }, 30 * 1000); // Every 30 seconds

        logger.info('Performance monitoring initialized');
    }

    /**
     * Enable/disable monitoring
     * @param {boolean} enabled - Enable monitoring
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        logger.info(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Update performance thresholds
     * @param {object} thresholds - New thresholds
     */
    updateThresholds(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
        logger.info('Performance thresholds updated', this.thresholds);
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;