/*
File: tests/integration/dataValidation.test.js
Integration tests for the data validation pipeline
- End-to-end validation testing
- Quality metrics validation
- Performance benchmark testing
- Facebook CAPI readiness testing
*/
'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { models, sequelize } = require('../../src/database');
const dataValidationPipeline = require('../../src/validators/dataValidationPipeline');
const performanceMonitor = require('../../src/utils/performanceMonitor');
const { STANDARD_EVENTS } = require('../../src/constants/eventStandards');

describe('Data Validation Pipeline Integration Tests', () => {
    let testClient, testWebsite, testApiKey;

    beforeAll(async () => {
        // Clear test database
        await sequelize.sync({ force: true });
        
        // Create test client and website
        testClient = await models.Client.create({
            name: 'Test Client',
            email: 'test@example.com',
            password: 'hashedpassword'
        });

        testWebsite = await models.Website.create({
            client_id: testClient.id,
            name: 'Test Website',
            domain: 'test.example.com',
            api_key: 'test_api_key_123456789'
        });

        testApiKey = testWebsite.api_key;
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(() => {
        // Reset validation pipeline stats
        dataValidationPipeline.resetStats();
        
        // Enable performance monitoring for tests
        performanceMonitor.setEnabled(true);
    });

    describe('Event Validation Pipeline', () => {
        test('should validate and process standard events correctly', async () => {
            const eventData = {
                apiKey: testApiKey,
                eventName: 'PageView',
                properties: {
                    page_url: 'https://test.example.com/product/123',
                    page_title: 'Product Page',
                    user: {
                        ls_user_id: 'test_user_123'
                    },
                    context: {
                        page_url: 'https://test.example.com/product/123',
                        user_agent: 'Mozilla/5.0...'
                    }
                },
                sessionId: 'test_session_123',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(202);

            expect(response.body.success).toBe(true);
            expect(response.body.validation.passed).toBe(true);
            expect(response.body.validation.quality_score).toBeGreaterThan(80);
            expect(response.body.validation.data_completeness).toBeGreaterThan(80);
            expect(response.body.standardization.standardized_name).toBe('PageView');
        });

        test('should handle legacy event migration', async () => {
            const eventData = {
                apiKey: testApiKey,
                eventName: 'page_view', // Legacy name
                properties: {
                    page_url: 'https://test.example.com',
                    user: { ls_user_id: 'test_user_123' },
                    context: { page_url: 'https://test.example.com' }
                },
                sessionId: 'test_session_124',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(202);

            expect(response.body.standardization.migrated).toBe(true);
            expect(response.body.standardization.original_name).toBe('page_view');
            expect(response.body.standardization.standardized_name).toBe('PageView');
            expect(response.body.validation.warnings).toContain(
                expect.stringContaining('Migrated legacy event')
            );
        });

        test('should validate e-commerce events with required properties', async () => {
            const eventData = {
                apiKey: testApiKey,
                eventName: 'AddToCart',
                properties: {
                    product_id: 'prod_123',
                    product_name: 'Test Product',
                    value: 29.99,
                    currency: 'USD',
                    quantity: 2,
                    user: { ls_user_id: 'test_user_123' },
                    context: { page_url: 'https://test.example.com/product/123' }
                },
                sessionId: 'test_session_125',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(202);

            expect(response.body.validation.passed).toBe(true);
            expect(response.body.validation.facebook_capi_ready).toBe(true);
            expect(response.body.validation.quality_score).toBeGreaterThan(85);
        });

        test('should flag missing required properties', async () => {
            const eventData = {
                apiKey: testApiKey,
                eventName: 'Purchase',
                properties: {
                    // Missing required properties: product_id, value, currency
                    order_id: 'order_123',
                    user: { ls_user_id: 'test_user_123' },
                    context: { page_url: 'https://test.example.com/checkout' }
                },
                sessionId: 'test_session_126',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(202); // Still accepted but with warnings

            expect(response.body.validation.warnings.length).toBeGreaterThan(0);
            expect(response.body.validation.facebook_capi_ready).toBe(false);
            expect(response.body.validation.quality_score).toBeLessThan(80);
        });

        test('should validate privacy compliance', async () => {
            const eventData = {
                apiKey: testApiKey,
                eventName: 'Lead',
                properties: {
                    email: 'user@example.com', // Unhashed PII
                    phone: '+1234567890', // Unhashed PII
                    user: { ls_user_id: 'test_user_123' },
                    context: { page_url: 'https://test.example.com/contact' }
                },
                sessionId: 'test_session_127',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(202);

            expect(response.body.validation.privacy_compliant).toBe(false);
            expect(response.body.validation.warnings).toContain(
                expect.stringContaining('should be hashed')
            );
        });

        test('should handle malformed data gracefully', async () => {
            const eventData = {
                apiKey: testApiKey,
                eventName: 'AddToCart',
                properties: {
                    value: 'not-a-number', // Invalid data type
                    currency: 123, // Should be string
                    user: { ls_user_id: 'test_user_123' },
                    context: { page_url: 'invalid-url' }
                },
                sessionId: 'test_session_128',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(202);

            expect(response.body.validation.warnings.length).toBeGreaterThan(0);
            expect(response.body.validation.quality_score).toBeLessThan(70);
        });
    });

    describe('Quality Metrics API', () => {
        beforeEach(async () => {
            // Create some test events for metrics calculation
            await models.Event.bulkCreate([
                {
                    session_id: 'test_session_metrics_1',
                    event_name: 'PageView',
                    properties: { page_url: 'https://test.example.com' },
                    timestamp: new Date(),
                    metadata: { 
                        quality_score: 95,
                        facebook_capi_ready: true,
                        privacy_compliant: true,
                        validation_passed: true
                    }
                },
                {
                    session_id: 'test_session_metrics_2',
                    event_name: 'AddToCart',
                    properties: { product_id: 'prod_123', value: 29.99 },
                    timestamp: new Date(),
                    metadata: { 
                        quality_score: 88,
                        facebook_capi_ready: true,
                        privacy_compliant: false,
                        validation_passed: true
                    }
                },
                {
                    session_id: 'test_session_metrics_3',
                    event_name: 'page_view', // Legacy event
                    properties: { page_url: 'https://test.example.com' },
                    timestamp: new Date(),
                    metadata: { 
                        quality_score: 75,
                        facebook_capi_ready: false,
                        privacy_compliant: true,
                        validation_passed: true,
                        original_name: 'page_view'
                    }
                }
            ]);

            // Create test session for events
            await models.Session.create({
                id: 'test_session_metrics_1',
                website_id: testWebsite.id,
                ls_user_id: 'test_user_metrics',
                start_time: new Date(),
                end_time: new Date(),
                landing_page: 'https://test.example.com'
            });
        });

        test('should return quality metrics for website', async () => {
            // First authenticate to get a token
            const authResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'hashedpassword'
                });

            const token = authResponse.body.accessToken;

            const response = await request(app)
                .get(`/api/v1/websites/${testWebsite.id}/quality-metrics`)
                .set('Authorization', `Bearer ${token}`)
                .query({ timeWindow: 60 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('website_id');
            expect(response.body.data).toHaveProperty('standardization_score');
            expect(response.body.data).toHaveProperty('facebook_capi_score');
            expect(response.body.data).toHaveProperty('privacy_compliance_score');
            expect(response.body.data).toHaveProperty('total_events');
        });

        test('should return performance metrics', async () => {
            const authResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'hashedpassword'
                });

            const token = authResponse.body.accessToken;

            const response = await request(app)
                .get(`/api/v1/websites/${testWebsite.id}/performance-metrics`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('event_processing');
            expect(response.body.data).toHaveProperty('system');
            expect(response.body.data).toHaveProperty('health_score');
        });

        test('should return event distribution data', async () => {
            const authResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'hashedpassword'
                });

            const token = authResponse.body.accessToken;

            const response = await request(app)
                .get(`/api/v1/websites/${testWebsite.id}/event-distribution`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('distribution');
            expect(response.body.data.total_events).toBeGreaterThan(0);
        });
    });

    describe('Performance Benchmarks', () => {
        test('should process events within performance thresholds', async () => {
            const startTime = Date.now();
            
            const eventData = {
                apiKey: testApiKey,
                eventName: 'PageView',
                properties: {
                    page_url: 'https://test.example.com',
                    user: { ls_user_id: 'test_user_perf' },
                    context: { page_url: 'https://test.example.com' }
                },
                sessionId: 'test_session_perf',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(202);

            const processingTime = response.body.performance.processing_time;
            
            // Assert processing time is within acceptable limits
            expect(processingTime).toBeLessThan(200); // ms
            expect(response.body.validation.passed).toBe(true);
        });

        test('should handle high-volume event processing', async () => {
            const eventPromises = [];
            const eventCount = 10;

            for (let i = 0; i < eventCount; i++) {
                const eventData = {
                    apiKey: testApiKey,
                    eventName: 'PageView',
                    properties: {
                        page_url: `https://test.example.com/page-${i}`,
                        user: { ls_user_id: `test_user_bulk_${i}` },
                        context: { page_url: `https://test.example.com/page-${i}` }
                    },
                    sessionId: `test_session_bulk_${i}`,
                    timestamp: new Date().toISOString()
                };

                eventPromises.push(
                    request(app)
                        .post('/api/v1/track/event')
                        .send(eventData)
                );
            }

            const responses = await Promise.all(eventPromises);
            
            // All events should be processed successfully
            responses.forEach((response, index) => {
                expect(response.status).toBe(202);
                expect(response.body.success).toBe(true);
                expect(response.body.validation.passed).toBe(true);
            });

            // Check average processing time
            const avgProcessingTime = responses.reduce((sum, res) => 
                sum + res.body.performance.processing_time, 0
            ) / responses.length;
            
            expect(avgProcessingTime).toBeLessThan(250); // ms average
        });
    });

    describe('Data Standards Compliance', () => {
        test('should validate all standard events properly', async () => {
            const standardEventTests = Object.values(STANDARD_EVENTS).slice(0, 5); // Test first 5 events
            
            for (const standardEvent of standardEventTests) {
                const eventData = {
                    apiKey: testApiKey,
                    eventName: standardEvent.name,
                    properties: {
                        ...(standardEvent.required_properties || []).reduce((props, prop) => {
                            // Provide mock data for required properties
                            if (prop === 'page_url') props[prop] = 'https://test.example.com';
                            if (prop === 'product_id') props[prop] = 'test_product_123';
                            if (prop === 'value') props[prop] = 99.99;
                            if (prop === 'currency') props[prop] = 'USD';
                            if (prop === 'content_ids') props[prop] = ['prod_1', 'prod_2'];
                            if (prop === 'content_type') props[prop] = 'product';
                            return props;
                        }, {}),
                        user: { ls_user_id: 'test_user_standards' },
                        context: { page_url: 'https://test.example.com' }
                    },
                    sessionId: `test_session_${standardEvent.name.toLowerCase()}`,
                    timestamp: new Date().toISOString()
                };

                const response = await request(app)
                    .post('/api/v1/track/event')
                    .send(eventData)
                    .expect(202);

                expect(response.body.success).toBe(true);
                expect(response.body.standardization.standardized_name).toBe(standardEvent.name);
                
                // Facebook compatible events should have higher quality scores
                if (standardEvent.facebook_event) {
                    expect(response.body.validation.facebook_capi_ready).toBe(true);
                    expect(response.body.validation.quality_score).toBeGreaterThan(85);
                }
            }
        });

        test('should maintain data integrity across validation pipeline', async () => {
            const originalEvent = {
                apiKey: testApiKey,
                eventName: 'Purchase',
                properties: {
                    product_id: 'prod_integrity_test',
                    product_name: 'Integrity Test Product',
                    value: 149.99,
                    currency: 'USD',
                    order_id: 'order_integrity_123',
                    user: { 
                        ls_user_id: 'test_user_integrity',
                        email: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' // Hashed
                    },
                    context: { page_url: 'https://test.example.com/checkout' }
                },
                sessionId: 'test_session_integrity',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(originalEvent)
                .expect(202);

            // Verify data integrity maintained
            expect(response.body.validation.passed).toBe(true);
            expect(response.body.validation.privacy_compliant).toBe(true);
            expect(response.body.validation.facebook_capi_ready).toBe(true);
            expect(response.body.validation.quality_score).toBeGreaterThan(90);

            // Verify event was stored correctly
            const storedEvent = await models.Event.findOne({
                where: { session_id: 'test_session_integrity' }
            });

            expect(storedEvent).toBeTruthy();
            expect(storedEvent.event_name).toBe('Purchase');
            expect(storedEvent.properties.product_id).toBe('prod_integrity_test');
            expect(storedEvent.properties.value).toBe(149.99);
            expect(storedEvent.metadata.validation_passed).toBe(true);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle invalid API keys gracefully', async () => {
            const eventData = {
                apiKey: 'invalid_api_key',
                eventName: 'PageView',
                properties: {},
                sessionId: 'test_session_invalid',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid API Key');
        });

        test('should handle missing required fields', async () => {
            const eventData = {
                apiKey: testApiKey,
                // Missing eventName
                properties: {
                    user: { ls_user_id: 'test_user_missing' },
                    context: { page_url: 'https://test.example.com' }
                },
                sessionId: 'test_session_missing',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/v1/track/event')
                .send(eventData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});

// Helper functions for test data generation
function generateMockEventData(eventName, overrides = {}) {
    return {
        apiKey: testApiKey,
        eventName,
        properties: {
            user: { ls_user_id: `test_user_${Date.now()}` },
            context: { page_url: 'https://test.example.com' },
            ...overrides
        },
        sessionId: `test_session_${Date.now()}`,
        timestamp: new Date().toISOString()
    };
}

function createHashedEmail(email) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email).digest('hex');
}