/*
File: src/utils/testDataStandardization.js
- Event validation testing framework
- Test utilities cho event standardization
- Performance và quality testing helpers
*/
'use strict';

const { 
  normalizeEventName, 
  validateEventProperties, 
  getEventDefinition,
  isFacebookCompatible,
  getFacebookEventName
} = require('../constants/eventStandards');

/**
 * Test Data cho Event Standardization
 */
const TEST_EVENTS = {
  valid: {
    PageView: {
      eventName: 'PageView',
      properties: {
        page_url: 'https://example.com/product/123',
        page_title: 'Product 123 - Example Store'
      }
    },
    Purchase: {
      eventName: 'Purchase',
      properties: {
        value: 99.99,
        currency: 'USD',
        order_id: 'order_123'
      }
    },
    AddToCart: {
      eventName: 'AddToCart',
      properties: {
        content_id: 'product_123',
        content_type: 'product'
      }
    }
  },
  invalid: {
    PurchaseMissingRequired: {
      eventName: 'Purchase',
      properties: {
        value: 99.99
        // Missing currency và order_id
      }
    },
    ViewContentMissingRequired: {
      eventName: 'ViewContent',
      properties: {
        content_name: 'Product Name'
        // Missing content_type
      }
    }
  },
  migration: {
    oldNamesToNew: [
      { old: 'page_view', new: 'PageView' },
      { old: 'add_to_cart', new: 'AddToCart' },
      { old: 'initiate_checkout', new: 'InitiateCheckout' },
      { old: 'scroll_25', new: 'ScrollDepth25' },
      { old: 'time_15s', new: 'TimeOnPage15s' }
    ]
  }
};

/**
 * Event Standardization Test Suite
 */
class EventStandardizationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Run all standardization tests
   */
  async runAllTests() {
    console.log('🧪 Starting Event Standardization Tests...\n');
    
    this.testEventNormalization();
    this.testEventValidation();
    this.testFacebookCompatibility();
    this.testMigrationMapping();
    this.testPerformance();
    
    this.printResults();
    return this.results;
  }

  /**
   * Test event name normalization
   */
  testEventNormalization() {
    console.log('📝 Testing Event Normalization...');
    
    // Test migration mapping
    TEST_EVENTS.migration.oldNamesToNew.forEach(({ old, new: expected }) => {
      const result = normalizeEventName(old);
      if (result === expected) {
        this.pass(`Migration: ${old} → ${expected}`);
      } else {
        this.fail(`Migration: ${old} expected ${expected}, got ${result}`);
      }
    });

    // Test already standardized names
    Object.keys(TEST_EVENTS.valid).forEach(eventName => {
      const result = normalizeEventName(eventName);
      if (result === eventName) {
        this.pass(`Standardized name unchanged: ${eventName}`);
      } else {
        this.fail(`Standardized name changed: ${eventName} → ${result}`);
      }
    });

    console.log('✅ Event Normalization Tests Complete\n');
  }

  /**
   * Test event validation
   */
  testEventValidation() {
    console.log('🔍 Testing Event Validation...');
    
    // Test valid events
    Object.entries(TEST_EVENTS.valid).forEach(([name, event]) => {
      const result = validateEventProperties(event.eventName, event.properties);
      if (result.valid) {
        this.pass(`Valid event: ${name}`);
      } else {
        this.fail(`Valid event failed: ${name} - ${result.errors.join(', ')}`);
      }
    });

    // Test invalid events
    Object.entries(TEST_EVENTS.invalid).forEach(([name, event]) => {
      const result = validateEventProperties(event.eventName, event.properties);
      if (!result.valid) {
        this.pass(`Invalid event correctly rejected: ${name}`);
      } else {
        this.fail(`Invalid event incorrectly passed: ${name}`);
      }
    });

    console.log('✅ Event Validation Tests Complete\n');
  }

  /**
   * Test Facebook CAPI compatibility
   */
  testFacebookCompatibility() {
    console.log('📘 Testing Facebook CAPI Compatibility...');
    
    const facebookEvents = ['PageView', 'ViewContent', 'AddToCart', 'Purchase', 'Lead'];
    const nonFacebookEvents = ['ScrollDepth25', 'TimeOnPage15s', 'ClickElement'];

    facebookEvents.forEach(eventName => {
      if (isFacebookCompatible(eventName)) {
        const fbEventName = getFacebookEventName(eventName);
        this.pass(`Facebook compatible: ${eventName} → ${fbEventName}`);
      } else {
        this.fail(`Should be Facebook compatible: ${eventName}`);
      }
    });

    nonFacebookEvents.forEach(eventName => {
      if (!isFacebookCompatible(eventName)) {
        this.pass(`Correctly not Facebook compatible: ${eventName}`);
      } else {
        this.fail(`Should not be Facebook compatible: ${eventName}`);
      }
    });

    console.log('✅ Facebook CAPI Tests Complete\n');
  }

  /**
   * Test migration mapping
   */
  testMigrationMapping() {
    console.log('🔄 Testing Migration Mapping...');
    
    const testCases = [
      { input: 'page_view', expected: 'PageView' },
      { input: 'PageView', expected: 'PageView' }, // No change needed
      { input: 'custom_event', expected: 'CustomEvent' }, // PascalCase fallback
      { input: null, expected: null },
      { input: '', expected: null }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = normalizeEventName(input);
      if (result === expected) {
        this.pass(`Migration mapping: "${input}" → "${expected}"`);
      } else {
        this.fail(`Migration mapping: "${input}" expected "${expected}", got "${result}"`);
      }
    });

    console.log('✅ Migration Mapping Tests Complete\n');
  }

  /**
   * Test performance của validation functions
   */
  testPerformance() {
    console.log('⚡ Testing Performance...');
    
    const iterations = 1000;
    
    // Test normalization performance
    const startNormalization = Date.now();
    for (let i = 0; i < iterations; i++) {
      normalizeEventName('page_view');
    }
    const normalizationTime = Date.now() - startNormalization;
    
    if (normalizationTime < 100) { // Should be < 100ms for 1000 iterations
      this.pass(`Normalization performance: ${normalizationTime}ms for ${iterations} iterations`);
    } else {
      this.fail(`Normalization too slow: ${normalizationTime}ms for ${iterations} iterations`);
    }

    // Test validation performance
    const startValidation = Date.now();
    for (let i = 0; i < iterations; i++) {
      validateEventProperties('Purchase', { value: 99, currency: 'USD', order_id: 'test' });
    }
    const validationTime = Date.now() - startValidation;
    
    if (validationTime < 200) { // Should be < 200ms for 1000 iterations
      this.pass(`Validation performance: ${validationTime}ms for ${iterations} iterations`);
    } else {
      this.fail(`Validation too slow: ${validationTime}ms for ${iterations} iterations`);
    }

    console.log('✅ Performance Tests Complete\n');
  }

  /**
   * Helper methods
   */
  pass(message) {
    this.results.passed++;
    console.log(`  ✅ ${message}`);
  }

  fail(message) {
    this.results.failed++;
    this.results.errors.push(message);
    console.log(`  ❌ ${message}`);
  }

  printResults() {
    console.log('📊 Test Results Summary:');
    console.log(`  ✅ Passed: ${this.results.passed}`);
    console.log(`  ❌ Failed: ${this.results.failed}`);
    console.log(`  📈 Success Rate: ${(this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
}

/**
 * Quality Assessment Utilities
 */
const qualityAssessment = {
  /**
   * Assess data quality score cho một event
   */
  assessEventQuality: (eventName, properties) => {
    const validation = validateEventProperties(eventName, properties);
    const eventDef = getEventDefinition(eventName);
    
    if (!eventDef) {
      return {
        score: 0,
        issues: ['Unknown event type'],
        recommendations: ['Use standardized event names']
      };
    }

    let score = 100;
    const issues = [];
    const recommendations = [];

    // Deduct for validation errors
    if (!validation.valid) {
      score -= validation.errors.length * 10;
      issues.push(...validation.errors);
      recommendations.push('Ensure all required properties are provided');
    }

    // Deduct for warnings
    if (validation.warnings.length > 0) {
      score -= validation.warnings.length * 5;
      issues.push(...validation.warnings);
    }

    // Bonus for Facebook compatibility
    if (isFacebookCompatible(eventName)) {
      score += 5;
    } else {
      recommendations.push('Consider using Facebook-compatible events for better tracking');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
      facebookCompatible: isFacebookCompatible(eventName)
    };
  },

  /**
   * Generate quality report cho một batch of events
   */
  generateQualityReport: (events) => {
    const report = {
      totalEvents: events.length,
      averageScore: 0,
      qualityDistribution: {
        excellent: 0, // 90-100
        good: 0,      // 70-89
        fair: 0,      // 50-69
        poor: 0       // 0-49
      },
      commonIssues: {},
      recommendations: new Set()
    };

    let totalScore = 0;

    events.forEach(({ eventName, properties }) => {
      const quality = qualityAssessment.assessEventQuality(eventName, properties);
      totalScore += quality.score;

      // Categorize quality
      if (quality.score >= 90) report.qualityDistribution.excellent++;
      else if (quality.score >= 70) report.qualityDistribution.good++;
      else if (quality.score >= 50) report.qualityDistribution.fair++;
      else report.qualityDistribution.poor++;

      // Aggregate issues
      quality.issues.forEach(issue => {
        report.commonIssues[issue] = (report.commonIssues[issue] || 0) + 1;
      });

      // Collect recommendations
      quality.recommendations.forEach(rec => report.recommendations.add(rec));
    });

    report.averageScore = totalScore / events.length;
    report.recommendations = Array.from(report.recommendations);

    return report;
  }
};

/**
 * Export utilities
 */
module.exports = {
  EventStandardizationTester,
  TEST_EVENTS,
  qualityAssessment
};