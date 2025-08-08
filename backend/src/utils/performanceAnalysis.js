/*
File: src/utils/performanceAnalysis.js
Performance impact assessment utilities for data validation pipeline
- Benchmarking and performance testing
- Resource usage analysis
- Performance regression detection
- Optimization recommendations
*/
'use strict';

const performanceMonitor = require('./performanceMonitor');
const dataValidationPipeline = require('../validators/dataValidationPipeline');
const logger = require('./logger');

/**
 * Performance Analysis utility for LoomSky data processing
 * Provides comprehensive performance assessment and optimization insights
 */
class PerformanceAnalysis {
    constructor() {
        this.benchmarkResults = new Map();
        this.baselineMetrics = null;
        this.performanceThresholds = {
            eventProcessing: {
                acceptable: 200, // ms
                warning: 300,
                critical: 500
            },
            dataValidation: {
                acceptable: 50,
                warning: 100,
                critical: 200
            },
            memoryUsage: {
                acceptable: 256, // MB
                warning: 512,
                critical: 1024
            },
            cpuUsage: {
                acceptable: 70, // %
                warning: 85,
                critical: 95
            }
        };
    }

    /**
     * Run comprehensive performance benchmark
     * @param {Object} options - Benchmark options
     * @returns {Object} - Benchmark results
     */
    async runPerformanceBenchmark(options = {}) {
        const {
            eventCount = 100,
            eventTypes = ['PageView', 'AddToCart', 'Purchase'],
            concurrent = false,
            iterations = 3
        } = options;

        logger.info('Starting performance benchmark', { eventCount, eventTypes, concurrent, iterations });

        const benchmarkResults = {
            metadata: {
                eventCount,
                eventTypes,
                concurrent,
                iterations,
                timestamp: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform
            },
            results: {
                overall: {},
                byEventType: {},
                systemImpact: {},
                iterations: []
            },
            recommendations: []
        };

        // Run multiple iterations for statistical accuracy
        for (let iteration = 0; iteration < iterations; iteration++) {
            logger.info(`Running benchmark iteration ${iteration + 1}/${iterations}`);
            
            const iterationResult = await this._runSingleBenchmark({
                eventCount,
                eventTypes,
                concurrent,
                iteration: iteration + 1
            });

            benchmarkResults.results.iterations.push(iterationResult);
        }

        // Calculate aggregate results
        benchmarkResults.results.overall = this._calculateAggregateResults(
            benchmarkResults.results.iterations
        );

        // Analyze system impact
        benchmarkResults.results.systemImpact = await this._analyzeSystemImpact();

        // Generate optimization recommendations
        benchmarkResults.recommendations = this._generateOptimizationRecommendations(
            benchmarkResults.results
        );

        // Store benchmark results
        this.benchmarkResults.set(Date.now(), benchmarkResults);

        logger.info('Performance benchmark completed', {
            avgProcessingTime: benchmarkResults.results.overall.avgProcessingTime,
            throughput: benchmarkResults.results.overall.throughput,
            successRate: benchmarkResults.results.overall.successRate
        });

        return benchmarkResults;
    }

    /**
     * Run single benchmark iteration
     * @param {Object} options - Benchmark options
     * @returns {Object} - Iteration results
     * @private
     */
    async _runSingleBenchmark(options) {
        const { eventCount, eventTypes, concurrent, iteration } = options;
        
        // Capture initial system state
        const initialMemory = process.memoryUsage();
        const initialCpuUsage = process.cpuUsage();
        const startTime = Date.now();

        const iterationResult = {
            iteration,
            events: [],
            processingTimes: [],
            validationResults: [],
            errors: [],
            systemMetrics: {
                initial: {
                    memory: initialMemory,
                    cpuUsage: initialCpuUsage
                }
            }
        };

        // Generate test events
        const testEvents = this._generateTestEvents(eventCount, eventTypes);

        try {
            if (concurrent) {
                // Process events concurrently
                const eventPromises = testEvents.map((event, index) => 
                    this._processTestEvent(event, index)
                );
                const results = await Promise.all(eventPromises);
                
                results.forEach(result => {
                    iterationResult.processingTimes.push(result.processingTime);
                    iterationResult.validationResults.push(result.validationResult);
                    if (result.error) {
                        iterationResult.errors.push(result.error);
                    }
                });
            } else {
                // Process events sequentially
                for (let i = 0; i < testEvents.length; i++) {
                    const result = await this._processTestEvent(testEvents[i], i);
                    iterationResult.processingTimes.push(result.processingTime);
                    iterationResult.validationResults.push(result.validationResult);
                    if (result.error) {
                        iterationResult.errors.push(result.error);
                    }
                }
            }
        } catch (error) {
            logger.error('Benchmark iteration failed:', error);
            iterationResult.errors.push(error.message);
        }

        // Capture final system state
        const endTime = Date.now();
        const finalMemory = process.memoryUsage();
        const finalCpuUsage = process.cpuUsage(initialCpuUsage);

        iterationResult.systemMetrics.final = {
            memory: finalMemory,
            cpuUsage: finalCpuUsage
        };

        iterationResult.systemMetrics.delta = {
            memory: {
                heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
                heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
                external: finalMemory.external - initialMemory.external,
                rss: finalMemory.rss - initialMemory.rss
            },
            cpuUsage: finalCpuUsage,
            duration: endTime - startTime
        };

        return iterationResult;
    }

    /**
     * Generate test events for benchmarking
     * @param {number} count - Number of events to generate
     * @param {Array} eventTypes - Types of events to generate
     * @returns {Array} - Test events
     * @private
     */
    _generateTestEvents(count, eventTypes) {
        const events = [];
        
        for (let i = 0; i < count; i++) {
            const eventType = eventTypes[i % eventTypes.length];
            const event = this._createTestEvent(eventType, i);
            events.push(event);
        }

        return events;
    }

    /**
     * Create a single test event
     * @param {string} eventType - Type of event
     * @param {number} index - Event index
     * @returns {Object} - Test event
     * @private
     */
    _createTestEvent(eventType, index) {
        const baseEvent = {
            event_name: eventType,
            timestamp: new Date().toISOString(),
            user_id: `test_user_${index}`,
            session_id: `test_session_${index}`,
            platform: 'web',
            page_url: `https://test.example.com/page/${index}`,
            user_agent: 'Mozilla/5.0 (Performance Test)'
        };

        const properties = {
            page_url: baseEvent.page_url,
            page_title: `Test Page ${index}`,
            user: {
                ls_user_id: baseEvent.user_id
            },
            context: {
                page_url: baseEvent.page_url,
                user_agent: baseEvent.user_agent
            }
        };

        // Add event-specific properties
        switch (eventType) {
            case 'AddToCart':
                properties.product_id = `prod_${index}`;
                properties.product_name = `Test Product ${index}`;
                properties.value = 29.99 + (index % 100);
                properties.currency = 'USD';
                properties.quantity = 1 + (index % 5);
                break;

            case 'Purchase':
                properties.content_ids = [`prod_${index}`, `prod_${index + 1}`];
                properties.content_type = 'product';
                properties.value = 99.99 + (index % 500);
                properties.currency = 'USD';
                properties.order_id = `order_${index}`;
                break;

            case 'ViewContent':
                properties.content_ids = [`prod_${index}`];
                properties.content_type = 'product';
                properties.product_id = `prod_${index}`;
                break;

            case 'Lead':
                properties.email = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // Hashed
                properties.consent_granted = true;
                break;
        }

        return { ...baseEvent, properties };
    }

    /**
     * Process a single test event
     * @param {Object} event - Test event
     * @param {number} index - Event index
     * @returns {Object} - Processing result
     * @private
     */
    async _processTestEvent(event, index) {
        const processingStartTime = Date.now();
        let validationResult = null;
        let error = null;

        try {
            validationResult = await dataValidationPipeline.validateEventData(event);
        } catch (err) {
            error = `Event ${index}: ${err.message}`;
            logger.error('Test event processing failed:', err);
        }

        const processingTime = Date.now() - processingStartTime;

        return {
            index,
            processingTime,
            validationResult,
            error
        };
    }

    /**
     * Calculate aggregate results from iterations
     * @param {Array} iterations - Iteration results
     * @returns {Object} - Aggregate results
     * @private
     */
    _calculateAggregateResults(iterations) {
        if (iterations.length === 0) return {};

        const allProcessingTimes = iterations.flatMap(iter => iter.processingTimes);
        const allValidationResults = iterations.flatMap(iter => iter.validationResults);
        const totalErrors = iterations.reduce((sum, iter) => sum + iter.errors.length, 0);

        const sortedTimes = allProcessingTimes.sort((a, b) => a - b);
        const totalDuration = iterations.reduce((sum, iter) => sum + iter.systemMetrics.delta.duration, 0);

        return {
            totalEvents: allProcessingTimes.length,
            totalErrors: totalErrors,
            successRate: ((allProcessingTimes.length - totalErrors) / allProcessingTimes.length) * 100,
            
            processingTime: {
                average: allProcessingTimes.reduce((sum, time) => sum + time, 0) / allProcessingTimes.length,
                min: Math.min(...allProcessingTimes),
                max: Math.max(...allProcessingTimes),
                median: sortedTimes[Math.floor(sortedTimes.length / 2)],
                p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
                p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
            },

            throughput: {
                eventsPerSecond: (allProcessingTimes.length * 1000) / totalDuration,
                eventsPerMinute: (allProcessingTimes.length * 60000) / totalDuration
            },

            quality: {
                averageScore: allValidationResults
                    .filter(r => r && r.quality_score)
                    .reduce((sum, r) => sum + r.quality_score, 0) / 
                    allValidationResults.filter(r => r && r.quality_score).length,
                facebookCapiReadyRate: (allValidationResults
                    .filter(r => r && r.metadata && r.metadata.facebookCapiReady).length / 
                    allValidationResults.length) * 100,
                privacyComplianceRate: (allValidationResults
                    .filter(r => r && r.metadata && r.metadata.privacyCompliant).length / 
                    allValidationResults.length) * 100
            },

            memory: {
                averageDelta: iterations.reduce((sum, iter) => 
                    sum + iter.systemMetrics.delta.memory.heapUsed, 0) / iterations.length,
                maxDelta: Math.max(...iterations.map(iter => iter.systemMetrics.delta.memory.heapUsed))
            }
        };
    }

    /**
     * Analyze system impact
     * @returns {Object} - System impact analysis
     * @private
     */
    async _analyzeSystemImpact() {
        const systemMetrics = performanceMonitor.getSystemMetrics();
        const validationStats = dataValidationPipeline.getStats();

        return {
            current: systemMetrics,
            validation: validationStats,
            impact: {
                memoryPressure: systemMetrics.memory.heapUsed > this.performanceThresholds.memoryUsage.warning,
                highEventLoopLag: systemMetrics.eventLoop.lag > 10,
                activeTimersCount: systemMetrics.activeTimers,
                validationOverhead: validationStats.averageQualityScore > 0 ? 
                    (validationStats.processed / systemMetrics.totalMetrics) * 100 : 0
            },
            recommendations: []
        };
    }

    /**
     * Generate optimization recommendations
     * @param {Object} results - Benchmark results
     * @returns {Array} - Optimization recommendations
     * @private
     */
    _generateOptimizationRecommendations(results) {
        const recommendations = [];
        const overall = results.overall;

        // Processing time recommendations
        if (overall.processingTime && overall.processingTime.average > this.performanceThresholds.eventProcessing.warning) {
            recommendations.push({
                category: 'performance',
                priority: overall.processingTime.average > this.performanceThresholds.eventProcessing.critical ? 'high' : 'medium',
                title: 'Optimize Event Processing',
                description: `Average processing time (${overall.processingTime.average.toFixed(2)}ms) exceeds threshold`,
                suggestions: [
                    'Consider caching frequently validated event patterns',
                    'Optimize validation pipeline stages for common event types',
                    'Implement parallel validation for independent checks',
                    'Review and optimize database queries in event processing'
                ]
            });
        }

        // Memory recommendations
        if (overall.memory && overall.memory.averageDelta > this.performanceThresholds.memoryUsage.acceptable * 1024 * 1024) {
            recommendations.push({
                category: 'memory',
                priority: 'medium',
                title: 'Memory Usage Optimization',
                description: `High memory usage delta detected: ${(overall.memory.averageDelta / 1024 / 1024).toFixed(2)}MB`,
                suggestions: [
                    'Implement object pooling for event validation results',
                    'Review and optimize data structures in validation pipeline',
                    'Consider streaming validation for large event batches',
                    'Implement garbage collection tuning'
                ]
            });
        }

        // Quality score recommendations
        if (overall.quality && overall.quality.averageScore < 85) {
            recommendations.push({
                category: 'quality',
                priority: 'medium',
                title: 'Data Quality Improvement',
                description: `Average quality score (${overall.quality.averageScore.toFixed(1)}) could be improved`,
                suggestions: [
                    'Enhance event standardization documentation',
                    'Implement client-side validation guidance',
                    'Provide real-time validation feedback to users',
                    'Create quality improvement templates'
                ]
            });
        }

        // Error rate recommendations
        if (overall.successRate < 95) {
            recommendations.push({
                category: 'reliability',
                priority: 'high',
                title: 'Improve Processing Reliability',
                description: `Success rate (${overall.successRate.toFixed(1)}%) indicates reliability issues`,
                suggestions: [
                    'Implement better error handling in validation pipeline',
                    'Add retry mechanisms for transient failures',
                    'Improve input validation and sanitization',
                    'Enhance error logging and monitoring'
                ]
            });
        }

        // Throughput recommendations
        if (overall.throughput && overall.throughput.eventsPerSecond < 10) {
            recommendations.push({
                category: 'throughput',
                priority: 'medium',
                title: 'Increase Processing Throughput',
                description: `Current throughput (${overall.throughput.eventsPerSecond.toFixed(1)} events/sec) may need improvement for high-traffic scenarios`,
                suggestions: [
                    'Implement event batching for validation pipeline',
                    'Consider horizontal scaling for validation workers',
                    'Optimize database connection pooling',
                    'Implement asynchronous validation where possible'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Compare performance against baseline
     * @param {Object} currentResults - Current benchmark results
     * @param {Object} baselineResults - Baseline results
     * @returns {Object} - Performance comparison
     */
    compareAgainstBaseline(currentResults, baselineResults) {
        if (!baselineResults) {
            return {
                hasBaseline: false,
                message: 'No baseline established'
            };
        }

        const comparison = {
            hasBaseline: true,
            regressions: [],
            improvements: [],
            summary: {}
        };

        // Compare processing time
        const currentAvgTime = currentResults.results.overall.processingTime.average;
        const baselineAvgTime = baselineResults.results.overall.processingTime.average;
        const timeDelta = currentAvgTime - baselineAvgTime;
        const timeChangePercent = (timeDelta / baselineAvgTime) * 100;

        if (Math.abs(timeChangePercent) > 10) { // 10% threshold
            if (timeChangePercent > 0) {
                comparison.regressions.push({
                    metric: 'processing_time',
                    current: currentAvgTime,
                    baseline: baselineAvgTime,
                    change: timeChangePercent,
                    severity: timeChangePercent > 25 ? 'high' : 'medium'
                });
            } else {
                comparison.improvements.push({
                    metric: 'processing_time',
                    current: currentAvgTime,
                    baseline: baselineAvgTime,
                    improvement: Math.abs(timeChangePercent)
                });
            }
        }

        // Compare success rate
        const currentSuccessRate = currentResults.results.overall.successRate;
        const baselineSuccessRate = baselineResults.results.overall.successRate;
        const successRateDelta = currentSuccessRate - baselineSuccessRate;

        if (Math.abs(successRateDelta) > 2) { // 2% threshold
            if (successRateDelta < 0) {
                comparison.regressions.push({
                    metric: 'success_rate',
                    current: currentSuccessRate,
                    baseline: baselineSuccessRate,
                    change: successRateDelta,
                    severity: Math.abs(successRateDelta) > 5 ? 'high' : 'medium'
                });
            } else {
                comparison.improvements.push({
                    metric: 'success_rate',
                    current: currentSuccessRate,
                    baseline: baselineSuccessRate,
                    improvement: successRateDelta
                });
            }
        }

        comparison.summary = {
            totalRegressions: comparison.regressions.length,
            totalImprovements: comparison.improvements.length,
            overallTrend: comparison.regressions.length > comparison.improvements.length ? 'regression' :
                          comparison.improvements.length > comparison.regressions.length ? 'improvement' : 'stable'
        };

        return comparison;
    }

    /**
     * Set baseline metrics for comparison
     * @param {Object} benchmarkResults - Benchmark results to use as baseline
     */
    setBaseline(benchmarkResults) {
        this.baselineMetrics = benchmarkResults;
        logger.info('Performance baseline established', {
            avgProcessingTime: benchmarkResults.results.overall.processingTime.average,
            successRate: benchmarkResults.results.overall.successRate
        });
    }

    /**
     * Get performance summary report
     * @returns {Object} - Performance summary
     */
    getPerformanceSummary() {
        const latestBenchmark = Array.from(this.benchmarkResults.values()).pop();
        const systemMetrics = performanceMonitor.getSystemMetrics();
        const validationStats = dataValidationPipeline.getStats();

        return {
            timestamp: new Date().toISOString(),
            system: systemMetrics,
            validation: validationStats,
            latestBenchmark: latestBenchmark ? {
                avgProcessingTime: latestBenchmark.results.overall.processingTime?.average,
                throughput: latestBenchmark.results.overall.throughput?.eventsPerSecond,
                successRate: latestBenchmark.results.overall.successRate,
                qualityScore: latestBenchmark.results.overall.quality?.averageScore
            } : null,
            status: this._determinePerformanceStatus(systemMetrics, validationStats, latestBenchmark)
        };
    }

    /**
     * Determine overall performance status
     * @param {Object} systemMetrics - System metrics
     * @param {Object} validationStats - Validation statistics
     * @param {Object} benchmarkResults - Latest benchmark results
     * @returns {string} - Performance status
     * @private
     */
    _determinePerformanceStatus(systemMetrics, validationStats, benchmarkResults) {
        const issues = [];

        if (systemMetrics.memory.heapUsed > this.performanceThresholds.memoryUsage.warning) {
            issues.push('high_memory');
        }

        if (systemMetrics.eventLoop.lag > 10) {
            issues.push('high_event_loop_lag');
        }

        if (benchmarkResults && benchmarkResults.results.overall.processingTime?.average > this.performanceThresholds.eventProcessing.warning) {
            issues.push('slow_processing');
        }

        if (validationStats.successRate < 95) {
            issues.push('low_success_rate');
        }

        if (issues.length === 0) return 'healthy';
        if (issues.length <= 2) return 'warning';
        return 'critical';
    }

    /**
     * Export performance data for external analysis
     * @param {string} format - Export format (json, csv)
     * @returns {string} - Exported data
     */
    exportPerformanceData(format = 'json') {
        const data = {
            benchmarks: Array.from(this.benchmarkResults.values()),
            baseline: this.baselineMetrics,
            summary: this.getPerformanceSummary()
        };

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
            
            case 'csv':
                // Simple CSV export for benchmarks
                const benchmarks = data.benchmarks;
                if (benchmarks.length === 0) return 'No benchmark data available';
                
                const headers = ['timestamp', 'avgProcessingTime', 'throughput', 'successRate', 'qualityScore'];
                const rows = benchmarks.map(b => [
                    b.metadata.timestamp,
                    b.results.overall.processingTime?.average || '',
                    b.results.overall.throughput?.eventsPerSecond || '',
                    b.results.overall.successRate || '',
                    b.results.overall.quality?.averageScore || ''
                ]);
                
                return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
}

// Create singleton instance
const performanceAnalysis = new PerformanceAnalysis();

module.exports = performanceAnalysis;