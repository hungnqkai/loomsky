/*
File: tests/unit/dataValidationPipeline.test.js
Unit tests for the data validation pipeline
- Individual validation stage testing
- Quality score calculation testing  
- Facebook CAPI readiness testing
- Privacy compliance testing
*/
'use strict';

const dataValidationPipeline = require('../../src/validators/dataValidationPipeline');
const { STANDARD_EVENTS } = require('../../src/constants/eventStandards');

describe('Data Validation Pipeline Unit Tests', () => {
    beforeEach(() => {
        // Reset pipeline statistics before each test
        dataValidationPipeline.resetStats();
    });

    describe('Event Structure Validation', () => {
        test('should validate correct event structure', async () => {
            const validEvent = {
                event_name: 'PageView',
                timestamp: new Date().toISOString(),
                user_id: 'user_123',
                session_id: 'session_123',
                platform: 'web',
                properties: {
                    page_url: 'https://example.com/page',
                    page_title: 'Test Page'
                }
            };

            const result = await dataValidationPipeline.validateEventData(validEvent);

            expect(result.isValid).toBe(true);
            expect(result.quality_score).toBeGreaterThan(80);
            expect(result.errors).toHaveLength(0);
        });

        test('should handle missing required fields', async () => {
            const invalidEvent = {
                // Missing event_name
                timestamp: new Date().toISOString(),
                properties: {}
            };

            const result = await dataValidationPipeline.validateEventData(invalidEvent);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Structure validation');
        });

        test('should add default timestamp if missing', async () => {
            const eventWithoutTimestamp = {
                event_name: 'PageView',
                properties: {}
            };

            const result = await dataValidationPipeline.validateEventData(eventWithoutTimestamp);

            expect(result.standardizedData.timestamp).toBeDefined();
            expect(new Date(result.standardizedData.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('Event Standardization', () => {
        test('should recognize standard events', async () => {
            const standardEvent = {
                event_name: 'PageView',
                properties: {
                    page_url: 'https://example.com',
                    page_title: 'Test Page'
                }
            };

            const result = await dataValidationPipeline.validateEventData(standardEvent);

            expect(result.isValid).toBe(true);
            expect(result.warnings).not.toContain(
                expect.stringContaining('Non-standard event')
            );
        });

        test('should flag non-standard events', async () => {
            const nonStandardEvent = {
                event_name: 'CustomEvent123',
                properties: {}
            };

            const result = await dataValidationPipeline.validateEventData(nonStandardEvent);

            expect(result.warnings).toContain(
                expect.stringContaining('Non-standard event name')
            );
        });

        test('should migrate legacy event names', async () => {
            // Add a mock legacy event mapping for testing
            const MOCK_LEGACY_EVENT = {
                name: 'PageView',
                legacy_names: ['page_view', 'pageview'],
                required_properties: ['page_url']
            };

            // Mock the standard events lookup
            const originalFind = Object.values;
            Object.values = jest.fn(() => [MOCK_LEGACY_EVENT]);

            const legacyEvent = {
                event_name: 'page_view',
                properties: {
                    page_url: 'https://example.com'
                }
            };

            const result = await dataValidationPipeline.validateEventData(legacyEvent);

            expect(result.standardizedData.event_name).toBe('PageView');
            expect(result.standardizedData._legacy_name).toBe('page_view');
            expect(result.warnings).toContain(
                expect.stringContaining('Migrated legacy event')
            );

            // Restore original function
            Object.values = originalFind;
        });

        test('should check for required properties', async () => {
            const eventMissingProps = {
                event_name: 'AddToCart',
                properties: {
                    // Missing product_id and value
                    product_name: 'Test Product'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventMissingProps);

            expect(result.warnings.some(w => w.includes('Missing required properties'))).toBe(true);
        });
    });

    describe('Data Type Validation', () => {
        test('should validate and convert numeric values', async () => {
            const eventWithStringValue = {
                event_name: 'Purchase',
                properties: {
                    value: '99.99', // String that should be converted to number
                    currency: 'USD'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithStringValue);

            expect(result.standardizedData.properties.value).toBe(99.99);
            expect(typeof result.standardizedData.properties.value).toBe('number');
        });

        test('should flag invalid numeric values', async () => {
            const eventWithInvalidValue = {
                event_name: 'Purchase',
                properties: {
                    value: 'not-a-number',
                    currency: 'USD'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithInvalidValue);

            expect(result.warnings).toContain(
                expect.stringContaining('Value property is not a valid number')
            );
        });

        test('should validate email format', async () => {
            const eventWithInvalidEmail = {
                event_name: 'Lead',
                properties: {
                    email: 'invalid-email-format'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithInvalidEmail);

            expect(result.warnings).toContain(
                expect.stringContaining('Invalid email format')
            );
        });

        test('should validate phone format', async () => {
            const eventWithValidPhone = {
                event_name: 'Lead',
                properties: {
                    phone: '+1234567890'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithValidPhone);

            expect(result.warnings).not.toContain(
                expect.stringContaining('Invalid phone format')
            );
        });
    });

    describe('Business Rules Validation', () => {
        test('should enforce e-commerce event rules', async () => {
            const addToCartWithoutProduct = {
                event_name: 'AddToCart',
                properties: {
                    value: 29.99
                    // Missing product_id
                }
            };

            const result = await dataValidationPipeline.validateEventData(addToCartWithoutProduct);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                expect.stringContaining('E-commerce events require product_id')
            );
        });

        test('should validate purchase event requirements', async () => {
            const purchaseEvent = {
                event_name: 'Purchase',
                properties: {
                    product_id: 'prod_123',
                    value: 99.99,
                    currency: 'USD',
                    order_id: 'order_123'
                }
            };

            const result = await dataValidationPipeline.validateEventData(purchaseEvent);

            expect(result.isValid).toBe(true);
            expect(result.quality_score).toBeGreaterThan(85);
        });

        test('should flag invalid purchase values', async () => {
            const invalidPurchase = {
                event_name: 'Purchase',
                properties: {
                    product_id: 'prod_123',
                    value: -10, // Invalid negative value
                    currency: 'USD'
                }
            };

            const result = await dataValidationPipeline.validateEventData(invalidPurchase);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                expect.stringContaining('Purchase value must be greater than 0')
            );
        });

        test('should validate lead events', async () => {
            const leadWithoutContact = {
                event_name: 'Lead',
                properties: {
                    // No email or phone
                    first_name: 'John'
                }
            };

            const result = await dataValidationPipeline.validateEventData(leadWithoutContact);

            expect(result.warnings).toContain(
                expect.stringContaining('Lead events should include contact information')
            );
        });
    });

    describe('Facebook CAPI Validation', () => {
        test('should identify CAPI-ready events', async () => {
            const capiReadyEvent = {
                event_name: 'AddToCart',
                user_id: 'user_123',
                properties: {
                    content_ids: ['prod_123'],
                    content_type: 'product',
                    value: 29.99,
                    currency: 'USD'
                }
            };

            const result = await dataValidationPipeline.validateEventData(capiReadyEvent);

            expect(result.metadata.facebookCapiReady).toBe(true);
            expect(result.quality_score).toBeGreaterThan(90);
        });

        test('should flag missing CAPI parameters', async () => {
            const incompleteCAPIEvent = {
                event_name: 'AddToCart',
                properties: {
                    // Missing content_ids and content_type
                    value: 29.99,
                    currency: 'USD'
                }
            };

            const result = await dataValidationPipeline.validateEventData(incompleteCAPIEvent);

            expect(result.metadata.facebookCapiReady).toBe(false);
            expect(result.warnings).toContain(
                expect.stringContaining('Missing Facebook CAPI parameters')
            );
        });

        test('should require user identification for CAPI', async () => {
            const eventWithoutUserID = {
                event_name: 'ViewContent',
                properties: {
                    content_ids: ['prod_123'],
                    content_type: 'product'
                    // No user identification
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithoutUserID);

            expect(result.warnings).toContain(
                expect.stringContaining('Facebook CAPI requires user identification')
            );
        });

        test('should validate content_ids format', async () => {
            const eventWithStringContentId = {
                event_name: 'ViewContent',
                user_id: 'user_123',
                properties: {
                    content_ids: 'prod_123', // Should be array
                    content_type: 'product'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithStringContentId);

            expect(result.standardizedData.properties.content_ids).toEqual(['prod_123']);
        });
    });

    describe('Privacy Compliance Validation', () => {
        test('should detect unhashed PII', async () => {
            const eventWithPII = {
                event_name: 'Lead',
                properties: {
                    email: 'user@example.com', // Unhashed email
                    phone: '+1234567890', // Unhashed phone
                    first_name: 'John'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithPII);

            expect(result.metadata.privacyCompliant).toBe(false);
            expect(result.warnings).toContain(
                expect.stringContaining('should be hashed for privacy compliance')
            );
        });

        test('should accept properly hashed PII', async () => {
            const eventWithHashedPII = {
                event_name: 'Lead',
                properties: {
                    email: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // SHA-256 hash
                    consent_granted: true
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithHashedPII);

            expect(result.metadata.privacyCompliant).toBe(true);
        });

        test('should flag missing consent information', async () => {
            const eventWithoutConsent = {
                event_name: 'Lead',
                properties: {
                    email: 'hashed_email_value'
                    // No consent information
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithoutConsent);

            expect(result.warnings).toContain(
                expect.stringContaining('Missing user consent information')
            );
        });

        test('should detect potential PII in custom properties', async () => {
            const eventWithHiddenPII = {
                event_name: 'CustomEvent',
                properties: {
                    user_data: 'user@example.com', // PII in custom field
                    consent_granted: true
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventWithHiddenPII);

            expect(result.warnings).toContain(
                expect.stringContaining('Potential PII detected')
            );
        });
    });

    describe('Quality Score Calculation', () => {
        test('should calculate high quality score for perfect events', async () => {
            const perfectEvent = {
                event_name: 'Purchase',
                user_id: 'user_123',
                properties: {
                    content_ids: ['prod_123'],
                    content_type: 'product',
                    value: 99.99,
                    currency: 'USD',
                    order_id: 'order_123',
                    email: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Hashed
                    consent_granted: true
                }
            };

            const result = await dataValidationPipeline.validateEventData(perfectEvent);

            expect(result.quality_score).toBeGreaterThanOrEqual(95);
            expect(result.metadata.facebookCapiReady).toBe(true);
            expect(result.metadata.privacyCompliant).toBe(true);
        });

        test('should penalize quality score for errors and warnings', async () => {
            const problematicEvent = {
                event_name: 'NonStandardEvent',
                properties: {
                    value: 'invalid-number',
                    email: 'unhashed@example.com'
                }
            };

            const result = await dataValidationPipeline.validateEventData(problematicEvent);

            expect(result.quality_score).toBeLessThan(70);
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        test('should calculate data completeness accurately', async () => {
            const partialEvent = {
                event_name: 'AddToCart',
                properties: {
                    product_id: 'prod_123',
                    // Missing value and currency
                }
            };

            const result = await dataValidationPipeline.validateEventData(partialEvent);

            expect(result.metadata.dataCompleteness).toBeLessThan(100);
            expect(result.metadata.dataCompleteness).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Pipeline Statistics', () => {
        test('should track pipeline statistics', async () => {
            // Process several events
            const events = [
                { event_name: 'PageView', properties: {} },
                { event_name: 'AddToCart', properties: { product_id: 'prod_123', value: 29.99 } },
                { event_name: 'InvalidEvent', properties: {} }
            ];

            for (const event of events) {
                await dataValidationPipeline.validateEventData(event);
            }

            const stats = dataValidationPipeline.getStats();

            expect(stats.processed).toBe(3);
            expect(stats.passed).toBeGreaterThanOrEqual(2);
            expect(stats.warnings).toBeGreaterThan(0);
            expect(stats.averageQualityScore).toBeGreaterThan(0);
            expect(stats.successRate).toBeGreaterThan(0);
        });

        test('should reset statistics correctly', async () => {
            // Process an event
            await dataValidationPipeline.validateEventData({
                event_name: 'PageView',
                properties: {}
            });

            let stats = dataValidationPipeline.getStats();
            expect(stats.processed).toBe(1);

            // Reset stats
            dataValidationPipeline.resetStats();
            
            stats = dataValidationPipeline.getStats();
            expect(stats.processed).toBe(0);
            expect(stats.passed).toBe(0);
            expect(stats.warnings).toBe(0);
            expect(stats.errors).toBe(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle validation pipeline errors gracefully', async () => {
            // Mock an internal error by passing invalid data structure
            const invalidData = null;

            const result = await dataValidationPipeline.validateEventData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.quality_score).toBe(0);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Validation pipeline error');
        });

        test('should continue processing after individual stage failures', async () => {
            // This tests the pipeline's resilience to individual stage failures
            const eventData = {
                event_name: 'TestEvent',
                properties: {
                    // Some valid data
                    page_url: 'https://example.com'
                }
            };

            const result = await dataValidationPipeline.validateEventData(eventData);

            // Should still return a result even if some stages have issues
            expect(result).toBeDefined();
            expect(result.isValid).toBeDefined();
            expect(result.quality_score).toBeDefined();
        });
    });
});