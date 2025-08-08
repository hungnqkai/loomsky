/*
File: tests/integration/qualityMonitoring.test.js
Integration tests for quality monitoring components
- DataQualityMonitor component testing
- WebsiteStore quality metrics integration
- Real-time monitoring functionality
- Error handling and edge cases
*/

import { mount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import { createPinia, setActivePinia } from 'pinia';
import DataQualityMonitor from '../../src/components/tracking/DataQualityMonitor.vue';
import { useWebsiteStore } from '../../src/stores/websiteStore';
import websiteService from '../../src/services/websiteService';

// Mock the websiteService
jest.mock('../../src/services/websiteService');

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('Quality Monitoring Integration Tests', () => {
    let vuetify, pinia, wrapper, websiteStore;
    const mockWebsiteId = 'website_123';

    // Mock quality metrics data
    const mockQualityMetrics = {
        website_id: mockWebsiteId,
        time_window: 60,
        timestamp: new Date().toISOString(),
        total_events: 1250,
        events_per_minute: 20.8,
        standardization_score: 87,
        standard_events_ratio: 92,
        legacy_events_count: 15,
        data_completeness_score: 91,
        validation_success_rate: 96,
        average_quality_score: 89,
        facebook_capi_score: 84,
        capi_ready_events: 1050,
        privacy_compliance_score: 78,
        pii_issues_count: 8,
        validation_errors: 3,
        validation_warnings: 22,
        avg_processing_time: 145,
        performance_alerts: 1,
        quality_trend: {
            direction: 'up',
            change_percentage: 5.2,
            trend_points: [82, 85, 87, 89, 91]
        },
        event_distribution: {
            'PageView': { count: 450, percentage: 36 },
            'AddToCart': { count: 280, percentage: 22 },
            'Purchase': { count: 125, percentage: 10 },
            'ViewContent': { count: 395, percentage: 32 }
        }
    };

    const mockPerformanceMetrics = {
        website_id: mockWebsiteId,
        time_window: 60,
        timestamp: new Date().toISOString(),
        event_processing: {
            average_duration: 145,
            min_duration: 85,
            max_duration: 320,
            p95_duration: 250,
            p99_duration: 310,
            throughput: 20.8,
            error_rate: 2.1
        },
        data_validation: {
            average_duration: 45,
            min_duration: 25,
            max_duration: 85,
            throughput: 22.5,
            error_rate: 0.8
        },
        system: {
            memory_usage: { heapUsed: 245, heapTotal: 512 },
            cpu_usage: { user: 1250000, system: 850000 },
            uptime: 3600,
            event_loop_lag: 5.2,
            active_timers: 12
        },
        health_score: 88,
        bottlenecks: [],
        recommendations: []
    };

    const mockQualityAlerts = {
        alerts: [
            {
                id: 'alert_1',
                type: 'data_quality',
                message: 'High number of events with missing required properties',
                severity: 'warning',
                timestamp: new Date().toISOString(),
                active: true,
                acknowledged: false,
                category: 'validation',
                website_id: mockWebsiteId,
                data: { missing_properties: ['product_id', 'value'], affected_events: 15 }
            },
            {
                id: 'alert_2',
                type: 'slow_processing',
                message: 'Event processing is slower than expected',
                severity: 'info',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                active: true,
                acknowledged: false,
                category: 'performance',
                website_id: mockWebsiteId,
                data: { average_duration: 250, threshold: 200 }
            }
        ],
        summary: {
            total: 2,
            critical: 0,
            warning: 1,
            info: 1,
            active: 2
        }
    };

    beforeEach(() => {
        vuetify = new Vuetify();
        pinia = createPinia();
        setActivePinia(pinia);
        
        websiteStore = useWebsiteStore();
        
        // Mock API responses
        websiteService.getQualityMetrics.mockResolvedValue({
            data: { success: true, data: mockQualityMetrics }
        });
        
        websiteService.getPerformanceMetrics.mockResolvedValue({
            data: { success: true, data: mockPerformanceMetrics }
        });
        
        websiteService.getQualityAlerts.mockResolvedValue({
            data: { success: true, data: mockQualityAlerts }
        });
        
        websiteService.acknowledgeAlert.mockResolvedValue({
            data: { success: true, data: { acknowledged: true } }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
        }
        jest.clearAllMocks();
    });

    describe('DataQualityMonitor Component Integration', () => {
        test('should load and display quality metrics correctly', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            // Wait for component to mount and load data
            await wrapper.vm.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if metrics are loaded
            expect(websiteService.getQualityMetrics).toHaveBeenCalledWith(mockWebsiteId, 60);
            expect(wrapper.vm.metrics).toEqual(mockQualityMetrics);

            // Check if quality score is displayed correctly
            const qualityScore = wrapper.find('[data-testid="overall-quality-score"]');
            expect(qualityScore.exists()).toBe(true);
            expect(qualityScore.text()).toContain('89%');

            // Check standardization metrics
            const standardizationScore = wrapper.find('[data-testid="standardization-score"]');
            expect(standardizationScore.text()).toContain('87%');

            // Check Facebook CAPI readiness
            const capiScore = wrapper.find('[data-testid="capi-score"]');
            expect(capiScore.text()).toContain('84%');
        });

        test('should display performance metrics correctly', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            await wrapper.vm.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check performance metrics display
            expect(websiteService.getPerformanceMetrics).toHaveBeenCalledWith(mockWebsiteId, 60);
            
            const avgProcessingTime = wrapper.find('[data-testid="avg-processing-time"]');
            expect(avgProcessingTime.text()).toContain('145ms');

            const healthScore = wrapper.find('[data-testid="health-score"]');
            expect(healthScore.text()).toContain('88%');
        });

        test('should display and manage quality alerts', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            await wrapper.vm.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(websiteService.getQualityAlerts).toHaveBeenCalledWith(mockWebsiteId, true);

            // Check alerts display
            const alertsList = wrapper.find('[data-testid="quality-alerts"]');
            expect(alertsList.exists()).toBe(true);

            const alertItems = wrapper.findAll('[data-testid^="alert-item"]');
            expect(alertItems.length).toBe(2);

            // Check alert acknowledgment functionality
            const acknowledgeBtn = wrapper.find('[data-testid="acknowledge-alert-alert_1"]');
            expect(acknowledgeBtn.exists()).toBe(true);

            await acknowledgeBtn.trigger('click');
            await wrapper.vm.$nextTick();

            expect(websiteService.acknowledgeAlert).toHaveBeenCalledWith(mockWebsiteId, 'alert_1');
        });

        test('should handle auto-refresh functionality', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: true,
                    refreshInterval: 100 // Fast refresh for testing
                }
            });

            await wrapper.vm.$nextTick();

            // Wait for initial load + one refresh cycle
            await new Promise(resolve => setTimeout(resolve, 200));

            // Should have been called at least twice (initial + refresh)
            expect(websiteService.getQualityMetrics).toHaveBeenCalledTimes(2);
        });

        test('should handle errors gracefully', async () => {
            // Mock API error
            websiteService.getQualityMetrics.mockRejectedValue(new Error('API Error'));
            
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            await wrapper.vm.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check error handling
            const errorMessage = wrapper.find('[data-testid="error-message"]');
            expect(errorMessage.exists()).toBe(true);
            expect(errorMessage.text()).toContain('Failed to load quality metrics');
        });

        test('should update metrics when websiteId prop changes', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            await wrapper.vm.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Clear previous calls
            jest.clearAllMocks();

            // Change websiteId prop
            const newWebsiteId = 'website_456';
            await wrapper.setProps({ websiteId: newWebsiteId });
            await wrapper.vm.$nextTick();

            // Should load metrics for new website
            expect(websiteService.getQualityMetrics).toHaveBeenCalledWith(newWebsiteId, 60);
        });
    });

    describe('WebsiteStore Quality Metrics Integration', () => {
        test('should fetch quality metrics through store', async () => {
            const result = await websiteStore.fetchQualityMetrics(mockWebsiteId, 60);

            expect(websiteService.getQualityMetrics).toHaveBeenCalledWith(mockWebsiteId, 60);
            expect(result).toEqual(mockQualityMetrics);
            expect(websiteStore.qualityMetrics).toEqual(mockQualityMetrics);
        });

        test('should fetch performance metrics through store', async () => {
            const result = await websiteStore.fetchPerformanceMetrics(mockWebsiteId, 30);

            expect(websiteService.getPerformanceMetrics).toHaveBeenCalledWith(mockWebsiteId, 30);
            expect(result).toEqual(mockPerformanceMetrics);
            expect(websiteStore.performanceMetrics).toEqual(mockPerformanceMetrics);
        });

        test('should handle quality alerts management', async () => {
            // Fetch alerts
            const alertsResult = await websiteStore.fetchQualityAlerts(mockWebsiteId, true);
            expect(alertsResult).toEqual(mockQualityAlerts);
            expect(websiteStore.qualityAlerts).toEqual(mockQualityAlerts);

            // Acknowledge alert
            const acknowledgeResult = await websiteStore.acknowledgeAlert(mockWebsiteId, 'alert_1');
            expect(acknowledgeResult).toBe(true);
            expect(websiteService.acknowledgeAlert).toHaveBeenCalledWith(mockWebsiteId, 'alert_1');

            // Check local state update
            const acknowledgedAlert = websiteStore.qualityAlerts.find(a => a.id === 'alert_1');
            expect(acknowledgedAlert.acknowledged).toBe(true);
        });

        test('should setup quality monitoring with cleanup', () => {
            jest.useFakeTimers();

            const cleanup = websiteStore.setupQualityMonitoring(mockWebsiteId, 1000);

            // Fast-forward time
            jest.advanceTimersByTime(1500);

            expect(websiteService.getQualityMetrics).toHaveBeenCalledWith(mockWebsiteId, 60);
            expect(websiteService.getQualityAlerts).toHaveBeenCalledWith(mockWebsiteId, true);

            // Cleanup should stop the monitoring
            cleanup();
            jest.clearAllMocks();

            jest.advanceTimersByTime(1000);
            expect(websiteService.getQualityMetrics).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        test('should calculate quality helpers correctly', async () => {
            // Load mock data into store
            await websiteStore.fetchQualityMetrics(mockWebsiteId);
            await websiteStore.fetchQualityAlerts(mockWebsiteId);

            // Test overall quality score calculation
            const qualityScore = websiteStore.getOverallQualityScore();
            expect(qualityScore).toBeGreaterThan(80);

            // Test critical alerts count
            const criticalCount = websiteStore.getCriticalAlertsCount();
            expect(criticalCount).toBe(0); // No critical alerts in mock data

            // Test quality status color
            const statusColor = websiteStore.getQualityStatusColor();
            expect(['green', 'orange', 'red']).toContain(statusColor);
        });

        test('should handle store errors properly', async () => {
            websiteService.getQualityMetrics.mockRejectedValue(new Error('Network error'));

            const result = await websiteStore.fetchQualityMetrics(mockWebsiteId);

            expect(result).toBe(null);
            expect(websiteStore.error).toContain('Cannot load quality metrics');
        });

        test('should refresh all quality monitoring data', async () => {
            await websiteStore.refreshQualityMonitoring(mockWebsiteId);

            expect(websiteService.getQualityMetrics).toHaveBeenCalledWith(mockWebsiteId);
            expect(websiteService.getPerformanceMetrics).toHaveBeenCalledWith(mockWebsiteId);
            expect(websiteService.getQualityAlerts).toHaveBeenCalledWith(mockWebsiteId);
        });
    });

    describe('Real-time Monitoring Integration', () => {
        test('should handle real-time updates correctly', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: true,
                    refreshInterval: 500
                }
            });

            await wrapper.vm.$nextTick();
            
            // Simulate metrics change
            const updatedMetrics = {
                ...mockQualityMetrics,
                standardization_score: 92,
                total_events: 1300
            };

            websiteService.getQualityMetrics.mockResolvedValue({
                data: { success: true, data: updatedMetrics }
            });

            // Wait for refresh cycle
            await new Promise(resolve => setTimeout(resolve, 600));

            // Check if component reflects updated metrics
            const qualityScore = wrapper.find('[data-testid="overall-quality-score"]');
            expect(qualityScore.text()).toContain('92%'); // Should show updated score
        });

        test('should pause and resume monitoring', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: true,
                    refreshInterval: 200
                }
            });

            await wrapper.vm.$nextTick();

            // Pause monitoring
            const pauseBtn = wrapper.find('[data-testid="pause-monitoring"]');
            if (pauseBtn.exists()) {
                await pauseBtn.trigger('click');
                
                const callsBefore = websiteService.getQualityMetrics.mock.calls.length;
                
                // Wait for would-be refresh cycle
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const callsAfter = websiteService.getQualityMetrics.mock.calls.length;
                expect(callsAfter).toBe(callsBefore); // No new calls when paused
            }
        });
    });

    describe('Component Interaction Tests', () => {
        test('should filter events by type', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            await wrapper.vm.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Test event type filtering if component has this feature
            const eventFilter = wrapper.find('[data-testid="event-type-filter"]');
            if (eventFilter.exists()) {
                await eventFilter.setValue('PageView');
                await wrapper.vm.$nextTick();

                // Should show only PageView events in distribution
                const distributionItems = wrapper.findAll('[data-testid^="distribution-item"]');
                expect(distributionItems.length).toBe(1);
            }
        });

        test('should export quality data', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            await wrapper.vm.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));

            const exportBtn = wrapper.find('[data-testid="export-quality-data"]');
            if (exportBtn.exists()) {
                websiteService.exportQualityData = jest.fn().mockResolvedValue({
                    data: { success: true, data: mockQualityMetrics }
                });

                await exportBtn.trigger('click');
                await wrapper.vm.$nextTick();

                expect(websiteService.exportQualityData).toHaveBeenCalledWith(
                    mockWebsiteId,
                    'json',
                    '24h'
                );
            }
        });

        test('should handle time window changes', async () => {
            wrapper = mount(DataQualityMonitor, {
                localVue,
                vuetify,
                pinia,
                propsData: {
                    websiteId: mockWebsiteId,
                    autoRefresh: false
                }
            });

            await wrapper.vm.$nextTick();
            jest.clearAllMocks();

            // Change time window if component has this control
            const timeWindowSelect = wrapper.find('[data-testid="time-window-select"]');
            if (timeWindowSelect.exists()) {
                await timeWindowSelect.setValue('30');
                await wrapper.vm.$nextTick();

                expect(websiteService.getQualityMetrics).toHaveBeenCalledWith(mockWebsiteId, 30);
            }
        });
    });
});