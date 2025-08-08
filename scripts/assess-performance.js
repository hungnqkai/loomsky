#!/usr/bin/env node

/*
File: scripts/assess-performance.js
Performance assessment script for LoomSky data validation pipeline
Usage: node scripts/assess-performance.js [options]

Options:
  --events <number>     Number of test events to process (default: 100)
  --concurrent          Process events concurrently
  --iterations <number> Number of benchmark iterations (default: 3)
  --baseline            Set results as baseline
  --compare             Compare against existing baseline
  --export <format>     Export results (json|csv)
  --output <file>       Output file for export
*/

'use strict';

const path = require('path');
const fs = require('fs');
const { program } = require('commander');

// Set up path for modules
process.env.NODE_PATH = path.join(__dirname, '../backend/src');
require('module')._initPaths();

const performanceAnalysis = require('../backend/src/utils/performanceAnalysis');
const performanceMonitor = require('../backend/src/utils/performanceMonitor');
const dataValidationPipeline = require('../backend/src/validators/dataValidationPipeline');

// Configure command line options
program
    .description('Performance assessment for LoomSky data validation pipeline')
    .option('-e, --events <number>', 'Number of test events to process', '100')
    .option('-c, --concurrent', 'Process events concurrently', false)
    .option('-i, --iterations <number>', 'Number of benchmark iterations', '3')
    .option('-b, --baseline', 'Set results as baseline', false)
    .option('--compare', 'Compare against existing baseline', false)
    .option('--export <format>', 'Export results (json|csv)', '')
    .option('-o, --output <file>', 'Output file for export', '')
    .option('--verbose', 'Verbose output', false)
    .parse();

const options = program.opts();

// Convert string numbers to integers
const eventCount = parseInt(options.events, 10);
const iterations = parseInt(options.iterations, 10);

/**
 * Main performance assessment function
 */
async function assessPerformance() {
    console.log('🚀 LoomSky Performance Assessment Starting...\n');
    
    console.log('Configuration:');
    console.log(`  Events: ${eventCount}`);
    console.log(`  Concurrent: ${options.concurrent ? 'Yes' : 'No'}`);
    console.log(`  Iterations: ${iterations}`);
    console.log(`  Baseline: ${options.baseline ? 'Will set' : 'No'}`);
    console.log(`  Compare: ${options.compare ? 'Yes' : 'No'}`);
    console.log('');

    try {
        // Initialize performance monitoring
        performanceMonitor.setEnabled(true);
        console.log('✅ Performance monitoring enabled\n');

        // Get initial system state
        const initialSystemMetrics = performanceMonitor.getSystemMetrics();
        console.log('📊 Initial System Metrics:');
        console.log(`  Memory: ${initialSystemMetrics.memory.heapUsed}MB used / ${initialSystemMetrics.memory.heapTotal}MB total`);
        console.log(`  CPU: User=${initialSystemMetrics.cpu.user}, System=${initialSystemMetrics.cpu.system}`);
        console.log(`  Event Loop Lag: ${initialSystemMetrics.eventLoop.lag}ms`);
        console.log('');

        // Run benchmark
        console.log('🔄 Running performance benchmark...');
        const benchmarkResults = await performanceAnalysis.runPerformanceBenchmark({
            eventCount,
            concurrent: options.concurrent,
            iterations,
            eventTypes: ['PageView', 'AddToCart', 'ViewContent', 'Purchase', 'Lead']
        });

        // Display results
        displayResults(benchmarkResults);

        // Handle baseline operations
        if (options.baseline) {
            performanceAnalysis.setBaseline(benchmarkResults);
            console.log('✅ Results set as performance baseline\n');
        }

        // Handle comparison
        if (options.compare) {
            await compareWithBaseline(benchmarkResults);
        }

        // Handle export
        if (options.export) {
            await exportResults(benchmarkResults);
        }

        // Final system state
        const finalSystemMetrics = performanceMonitor.getSystemMetrics();
        console.log('📊 Final System Metrics:');
        console.log(`  Memory: ${finalSystemMetrics.memory.heapUsed}MB used / ${finalSystemMetrics.memory.heapTotal}MB total`);
        console.log(`  Memory Delta: ${finalSystemMetrics.memory.heapUsed - initialSystemMetrics.memory.heapUsed}MB`);
        console.log('');

        // Performance summary
        const summary = performanceAnalysis.getPerformanceSummary();
        console.log(`📋 Overall Performance Status: ${getStatusIcon(summary.status)} ${summary.status.toUpperCase()}`);

        console.log('✅ Performance assessment completed successfully!');

    } catch (error) {
        console.error('❌ Performance assessment failed:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

/**
 * Display benchmark results
 * @param {Object} results - Benchmark results
 */
function displayResults(results) {
    console.log('\n📈 Benchmark Results:');
    console.log('=' .repeat(50));
    
    const overall = results.results.overall;
    
    // Processing Performance
    console.log('\n⚡ Processing Performance:');
    console.log(`  Average Time: ${overall.processingTime.average.toFixed(2)}ms`);
    console.log(`  Median Time: ${overall.processingTime.median.toFixed(2)}ms`);
    console.log(`  95th Percentile: ${overall.processingTime.p95.toFixed(2)}ms`);
    console.log(`  99th Percentile: ${overall.processingTime.p99.toFixed(2)}ms`);
    console.log(`  Min/Max: ${overall.processingTime.min.toFixed(2)}ms / ${overall.processingTime.max.toFixed(2)}ms`);

    // Throughput
    console.log('\n🚀 Throughput:');
    console.log(`  Events/Second: ${overall.throughput.eventsPerSecond.toFixed(2)}`);
    console.log(`  Events/Minute: ${overall.throughput.eventsPerMinute.toFixed(0)}`);

    // Reliability
    console.log('\n🎯 Reliability:');
    console.log(`  Success Rate: ${overall.successRate.toFixed(2)}%`);
    console.log(`  Total Events: ${overall.totalEvents}`);
    console.log(`  Total Errors: ${overall.totalErrors}`);

    // Quality Metrics
    if (overall.quality) {
        console.log('\n🏆 Data Quality:');
        console.log(`  Average Quality Score: ${overall.quality.averageScore.toFixed(1)}/100`);
        console.log(`  Facebook CAPI Ready Rate: ${overall.quality.facebookCapiReadyRate.toFixed(1)}%`);
        console.log(`  Privacy Compliance Rate: ${overall.quality.privacyComplianceRate.toFixed(1)}%`);
    }

    // Memory Impact
    if (overall.memory) {
        console.log('\n💾 Memory Impact:');
        console.log(`  Average Delta: ${(overall.memory.averageDelta / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Max Delta: ${(overall.memory.maxDelta / 1024 / 1024).toFixed(2)}MB`);
    }

    // Recommendations
    if (results.recommendations && results.recommendations.length > 0) {
        console.log('\n💡 Optimization Recommendations:');
        results.recommendations.forEach((rec, index) => {
            const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
            console.log(`  ${index + 1}. ${priorityIcon} ${rec.title} (${rec.category})`);
            console.log(`     ${rec.description}`);
            if (options.verbose && rec.suggestions) {
                rec.suggestions.forEach(suggestion => {
                    console.log(`     - ${suggestion}`);
                });
            }
        });
    }
}

/**
 * Compare with baseline
 * @param {Object} currentResults - Current benchmark results
 */
async function compareWithBaseline(currentResults) {
    console.log('\n🔍 Baseline Comparison:');
    console.log('=' .repeat(30));

    try {
        // This would normally load from a file or database
        // For now, we'll simulate baseline comparison
        const mockBaseline = {
            results: {
                overall: {
                    processingTime: { average: 120 },
                    successRate: 98.5,
                    throughput: { eventsPerSecond: 15.2 }
                }
            }
        };

        const comparison = performanceAnalysis.compareAgainstBaseline(currentResults, mockBaseline);
        
        if (!comparison.hasBaseline) {
            console.log('⚠️  No baseline available for comparison');
            return;
        }

        console.log(`\n📊 Comparison Summary: ${comparison.summary.overallTrend.toUpperCase()}`);
        
        if (comparison.regressions.length > 0) {
            console.log('\n🔴 Performance Regressions:');
            comparison.regressions.forEach(reg => {
                const severityIcon = reg.severity === 'high' ? '🚨' : '⚠️';
                console.log(`  ${severityIcon} ${reg.metric}: ${reg.change > 0 ? '+' : ''}${reg.change.toFixed(1)}%`);
                console.log(`     Current: ${reg.current.toFixed(2)}, Baseline: ${reg.baseline.toFixed(2)}`);
            });
        }

        if (comparison.improvements.length > 0) {
            console.log('\n🟢 Performance Improvements:');
            comparison.improvements.forEach(imp => {
                console.log(`  ✅ ${imp.metric}: +${imp.improvement.toFixed(1)}% improvement`);
                console.log(`     Current: ${imp.current.toFixed(2)}, Baseline: ${imp.baseline.toFixed(2)}`);
            });
        }

        if (comparison.regressions.length === 0 && comparison.improvements.length === 0) {
            console.log('✅ Performance is stable compared to baseline');
        }

    } catch (error) {
        console.error('❌ Failed to compare with baseline:', error.message);
    }
}

/**
 * Export results
 * @param {Object} results - Benchmark results
 */
async function exportResults(results) {
    console.log('\n📤 Exporting Results:');
    
    try {
        const exportData = performanceAnalysis.exportPerformanceData(options.export);
        
        if (options.output) {
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, exportData);
            console.log(`✅ Results exported to: ${outputPath}`);
        } else {
            // Generate default filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `performance-assessment-${timestamp}.${options.export}`;
            const defaultPath = path.resolve(filename);
            
            fs.writeFileSync(defaultPath, exportData);
            console.log(`✅ Results exported to: ${defaultPath}`);
        }
    } catch (error) {
        console.error('❌ Failed to export results:', error.message);
    }
}

/**
 * Get status icon
 * @param {string} status - Performance status
 * @returns {string} - Status icon
 */
function getStatusIcon(status) {
    switch (status) {
        case 'healthy': return '🟢';
        case 'warning': return '🟡';
        case 'critical': return '🔴';
        default: return '❓';
    }
}

/**
 * Display help information
 */
function displayHelp() {
    console.log(`
🔧 LoomSky Performance Assessment Tool

This script benchmarks the performance of the data validation pipeline and provides
optimization recommendations.

Usage Examples:
  node scripts/assess-performance.js
  node scripts/assess-performance.js --events 500 --concurrent
  node scripts/assess-performance.js --baseline
  node scripts/assess-performance.js --compare --export json
  node scripts/assess-performance.js --events 1000 --iterations 5 --export csv --output results.csv

Performance Thresholds:
  - Event Processing: <200ms (acceptable), <300ms (warning), <500ms (critical)
  - Memory Usage: <256MB (acceptable), <512MB (warning), <1024MB (critical)
  - Success Rate: >95% (acceptable), >90% (warning), <90% (critical)

For detailed analysis, use --verbose flag.
    `);
}

// Handle help display
if (program.args.includes('--help') || program.args.includes('-h')) {
    displayHelp();
    process.exit(0);
}

// Handle process interruption
process.on('SIGINT', () => {
    console.log('\n⚠️  Performance assessment interrupted by user');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the assessment
if (require.main === module) {
    assessPerformance().catch(error => {
        console.error('❌ Performance assessment failed:', error);
        process.exit(1);
    });
}

module.exports = { assessPerformance };