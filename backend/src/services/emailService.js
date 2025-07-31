// backend/src/services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    try {
      if (!config.email.mailgun.apiKey || !config.email.mailgun.domain) {
        logger.warn('Mailgun credentials not configured. Email service will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: `postmaster@${config.email.mailgun.domain}`,
          pass: config.email.mailgun.apiKey
        }
      });

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not configured - skipping email send', { to: options.to, subject: options.subject });
        return { success: false, message: 'Email service not configured' };
      }

      const mailOptions = {
        from: `${config.email.fromName} <${config.email.from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to send email:', {
        error: error.message,
        to: options.to,
        subject: options.subject
      });
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const html = this.generateWelcomeEmailHTML(user);
    const text = this.generateWelcomeEmailText(user);

    return await this.sendEmail({
      to: user.email,
      subject: `Welcome to ${config.app.name}!`,
      html,
      text
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${verificationToken}`;
    const html = this.generateVerificationEmailHTML(user, verificationUrl);
    const text = this.generateVerificationEmailText(user, verificationUrl);

    return await this.sendEmail({
      to: user.email,
      subject: 'Please verify your email address',
      html,
      text
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;
    const html = this.generatePasswordResetEmailHTML(user, resetUrl);
    const text = this.generatePasswordResetEmailText(user, resetUrl);

    return await this.sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html,
      text
    });
  }

  /**
   * Send team invitation email
   */
  async sendTeamInvitationEmail(invitedUser, inviterUser, client, invitationToken) {
    const invitationUrl = `${config.app.frontendUrl}/accept-invitation?token=${invitationToken}`;
    const html = this.generateInvitationEmailHTML(invitedUser, inviterUser, client, invitationUrl);
    const text = this.generateInvitationEmailText(invitedUser, inviterUser, client, invitationUrl);

    return await this.sendEmail({
      to: invitedUser.email,
      subject: `You've been invited to join ${client.name} on ${config.app.name}`,
      html,
      text
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedNotification(user) {
    const html = this.generatePasswordChangedEmailHTML(user);
    const text = this.generatePasswordChangedEmailText(user);

    return await this.sendEmail({
      to: user.email,
      subject: 'Your password has been changed',
      html,
      text
    });
  }

  /**
   * Send subscription notification
   */
  async sendSubscriptionNotification(user, client, type, data = {}) {
    let subject, html, text;

    switch (type) {
      case 'trial_ending':
        subject = 'Your trial is ending soon';
        html = this.generateTrialEndingEmailHTML(user, client, data);
        text = this.generateTrialEndingEmailText(user, client, data);
        break;
      case 'payment_failed':
        subject = 'Payment failed for your subscription';
        html = this.generatePaymentFailedEmailHTML(user, client, data);
        text = this.generatePaymentFailedEmailText(user, client, data);
        break;
      case 'subscription_cancelled':
        subject = 'Your subscription has been cancelled';
        html = this.generateSubscriptionCancelledEmailHTML(user, client, data);
        text = this.generateSubscriptionCancelledEmailText(user, client, data);
        break;
      default:
        throw new Error(`Unknown subscription notification type: ${type}`);
    }

    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
  }

  // Email HTML Templates
  generateWelcomeEmailHTML(user) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${config.app.name}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6366F1; }
        .logo { font-size: 24px; font-weight: bold; color: #6366F1; }
        .content { padding: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${config.app.name}</div>
      </div>
      
      <div class="content">
        <h2>Welcome to ${config.app.name}, ${user.first_name}!</h2>
        
        <p>Thank you for joining ${config.app.name}. We're excited to help you track your customer journeys and optimize your conversions with powerful A/B testing.</p>
        
        <p>Here's what you can do with ${config.app.name}:</p>
        <ul>
          <li>Track customer journeys across multiple touchpoints</li>
          <li>Run sophisticated A/B tests to optimize conversions</li>
          <li>Integrate with Facebook CAPI for enhanced attribution</li>
          <li>Get real-time analytics and insights</li>
        </ul>
        
        <a href="${config.app.frontendUrl}/dashboard" class="button">Get Started</a>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br>The ${config.app.name} Team</p>
      </div>
      
      <div class="footer">
        <p>&copy; 2024 ${config.app.name}. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;
  }

  generateVerificationEmailHTML(user, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6366F1; }
        .logo { font-size: 24px; font-weight: bold; color: #6366F1; }
        .content { padding: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .warning { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${config.app.name}</div>
      </div>
      
      <div class="content">
        <h2>Please verify your email address</h2>
        
        <p>Hi ${user.first_name},</p>
        
        <p>Please click the button below to verify your email address and complete your registration:</p>
        
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
        
        <div class="warning">
          <strong>This link will expire in 24 hours.</strong> If you didn't create an account with ${config.app.name}, you can safely ignore this email.
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        
        <p>Best regards,<br>The ${config.app.name} Team</p>
      </div>
      
      <div class="footer">
        <p>&copy; 2024 ${config.app.name}. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;
  }

  generatePasswordResetEmailHTML(user, resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6366F1; }
        .logo { font-size: 24px; font-weight: bold; color: #6366F1; }
        .content { padding: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .warning { background: #FEE2E2; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${config.app.name}</div>
      </div>
      
      <div class="content">
        <h2>Reset your password</h2>
        
        <p>Hi ${user.first_name},</p>
        
        <p>We received a request to reset your password for your ${config.app.name} account.</p>
        
        <a href="${resetUrl}" class="button">Reset Password</a>
        
        <div class="warning">
          <strong>This link will expire in 1 hour.</strong> If you didn't request a password reset, you can safely ignore this email.
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        
        <p>Best regards,<br>The ${config.app.name} Team</p>
      </div>
      
      <div class="footer">
        <p>&copy; 2024 ${config.app.name}. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;
  }

  // Text versions for accessibility
  generateWelcomeEmailText(user) {
    return `
Welcome to ${config.app.name}, ${user.first_name}!

Thank you for joining ${config.app.name}. We're excited to help you track your customer journeys and optimize your conversions.

Get started: ${config.app.frontendUrl}/dashboard

Best regards,
The ${config.app.name} Team
    `;
  }

  generateVerificationEmailText(user, verificationUrl) {
    return `
Please verify your email address

Hi ${user.first_name},

Please click the link below to verify your email address:
${verificationUrl}

This link will expire in 24 hours.

Best regards,
The ${config.app.name} Team
    `;
  }

  generatePasswordResetEmailText(user, resetUrl) {
    return `
Reset your password

Hi ${user.first_name},

We received a request to reset your password. Click the link below to reset it:
${resetUrl}

This link will expire in 1 hour.

Best regards,
The ${config.app.name} Team
    `;
  }

  // Placeholder methods for other email types
  generateInvitationEmailHTML(invitedUser, inviterUser, client, invitationUrl) {
    return `<h2>Team Invitation</h2><p>You've been invited to join ${client.name}.</p><a href="${invitationUrl}">Accept Invitation</a>`;
  }

  generateInvitationEmailText(invitedUser, inviterUser, client, invitationUrl) {
    return `You've been invited to join ${client.name}. Click: ${invitationUrl}`;
  }

  generatePasswordChangedEmailHTML(user) {
    return `<h2>Password Changed</h2><p>Your password has been successfully changed.</p>`;
  }

  generatePasswordChangedEmailText(user) {
    return `Your password has been successfully changed.`;
  }

  generateTrialEndingEmailHTML(user, client, data) {
    return `<h2>Trial Ending Soon</h2><p>Your trial will end soon.</p>`;
  }

  generateTrialEndingEmailText(user, client, data) {
    return `Your trial will end soon.`;
  }

  generatePaymentFailedEmailHTML(user, client, data) {
    return `<h2>Payment Failed</h2><p>Your recent payment failed.</p>`;
  }

  generatePaymentFailedEmailText(user, client, data) {
    return `Your recent payment failed.`;
  }

  generateSubscriptionCancelledEmailHTML(user, client, data) {
    return `<h2>Subscription Cancelled</h2><p>Your subscription has been cancelled.</p>`;
  }

  generateSubscriptionCancelledEmailText(user, client, data) {
    return `Your subscription has been cancelled.`;
  }
}

module.exports = new EmailService();