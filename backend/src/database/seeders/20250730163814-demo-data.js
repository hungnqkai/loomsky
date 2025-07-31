// backend/src/database/seeders/20241201000001-demo-data.js
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const clientId = uuidv4();
    const userId = uuidv4();
    const subscriptionId = uuidv4();

    // Create demo client
    await queryInterface.bulkInsert('clients', [
      {
        id: clientId,
        name: 'Demo Company',
        slug: 'demo',
        email: 'demo@loomsky.com',
        domain: 'https://demo.loomsky.com',
        status: 'active',
        settings: JSON.stringify({
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
          date_format: 'YYYY-MM-DD',
          analytics: {
            data_retention_days: 365,
            session_timeout_minutes: 30,
            track_anonymous_users: true
          },
          notifications: {
            email_reports: true,
            webhook_alerts: false,
            weekly_summary: true
          },
          privacy: {
            anonymize_ip: false,
            gdpr_compliant: false,
            cookie_consent: false
          }
        }),
        integration_keys: JSON.stringify({}),
        limits: JSON.stringify({
          monthly_events: 100000,
          team_members: 10,
          projects: 10,
          ab_tests: 50,
          api_calls_per_hour: 1000
        }),
        current_usage: JSON.stringify({
          monthly_events: 0,
          team_members: 1,
          projects: 0,
          ab_tests: 0,
          api_calls_this_hour: 0
        }),
        onboarding_completed: true,
        onboarding_step: 10,
        last_activity_at: new Date(),
        billing_email: 'billing@demo.loomsky.com',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123456', 12);
    await queryInterface.bulkInsert('users', [
      {
        id: userId,
        client_id: clientId,
        email: 'demo@loomsky.com',
        password: hashedPassword,
        first_name: 'Demo',
        last_name: 'User',
        job_title: 'Marketing Manager',
        role: 'owner',
        permissions: JSON.stringify({
          dashboard: ['read', 'write'],
          analytics: ['read', 'write'],
          journey: ['read', 'write'],
          abtest: ['read', 'write'],
          integrations: ['read', 'write'],
          settings: ['read', 'write'],
          team: ['read', 'write'],
          billing: ['read', 'write']
        }),
        status: 'active',
        email_verified: true,
        preferences: JSON.stringify({
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            browser: true,
            weekly_reports: true,
            ab_test_results: true,
            system_alerts: true
          },
          dashboard: {
            default_date_range: '7d',
            show_tour: false,
            collapsed_sidebar: false
          }
        }),
        last_login_at: new Date(),
        last_login_ip: '127.0.0.1',
        login_count: 1,
        last_activity_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Create demo subscription
    const now = new Date();
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await queryInterface.bulkInsert('subscriptions', [
      {
        id: subscriptionId,
        client_id: clientId,
        plan_name: 'professional',
        plan_type: 'monthly',
        amount: 99.00,
        currency: 'USD',
        billing_cycle: 30,
        status: 'active',
        started_at: now,
        current_period_start: now,
        current_period_end: currentPeriodEnd,
        next_billing_date: currentPeriodEnd,
        limits: JSON.stringify({
          monthly_events: 100000,
          team_members: 10,
          projects: 10,
          ab_tests: 50,
          api_calls_per_hour: 1000,
          data_retention_days: 365,
          custom_integrations: true,
          priority_support: true,
          white_label: false
        }),
        features: JSON.stringify({
          journey_tracking: true,
          ab_testing: true,
          facebook_capi: true,
          real_time_analytics: true,
          custom_events: true,
          segmentation: true,
          advanced_reporting: true,
          api_access: true,
          webhook_notifications: true,
          sso: false
        }),
        addons: JSON.stringify({}),
        metadata: JSON.stringify({
          source: 'demo_seed',
          created_by: 'system'
        }),
        created_at: now,
        updated_at: now
      }
    ]);

    // Create demo payment
    await queryInterface.bulkInsert('payments', [
      {
        id: uuidv4(),
        client_id: clientId,
        subscription_id: subscriptionId,
        amount: 99.00,
        currency: 'USD',
        fee_amount: 3.20,
        net_amount: 95.80,
        type: 'subscription',
        payment_method: 'paypal',
        status: 'completed',
        description: 'Professional Plan - Monthly Subscription',
        invoice_number: `INV-${Date.now()}-DEMO`,
        billing_period_start: now,
        billing_period_end: currentPeriodEnd,
        processed_at: now,
        paypal_response: JSON.stringify({
          demo: true,
          transaction_id: 'DEMO_' + Date.now()
        }),
        customer_info: JSON.stringify({
          name: 'Demo User',
          email: 'demo@loomsky.com',
          company: 'Demo Company'
        }),
        metadata: JSON.stringify({
          source: 'demo_seed'
        }),
        created_at: now,
        updated_at: now
      }
    ]);

    console.log('✅ Demo data seeded successfully');
    console.log('📧 Demo login: demo@loomsky.com');
    console.log('🔑 Demo password: demo123456');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('payments', { invoice_number: { [Sequelize.Op.like]: 'INV-%DEMO' } });
    await queryInterface.bulkDelete('subscriptions', null, {});
    await queryInterface.bulkDelete('users', { email: 'demo@loomsky.com' });
    await queryInterface.bulkDelete('clients', { slug: 'demo' });
  }
};

