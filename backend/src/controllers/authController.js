// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { models, sequelize } = require('../database');
const jwtService = require('../services/jwtService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const asyncHandler = require('../middleware/asyncHandler');
const { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  securityValidation
} = require('../validators/authValidators');

class AuthController {
  /**
   * Register new user and client
   */
  register = asyncHandler(async (req, res) => {
    logger.info('Registration attempt started', { body: req.body, ip: req.ip });
    logger.info('--- AUTH CONTROLLER: REGISTER ---');
    logger.info('Validation passed. Processing registration for body:', req.body);

    try {
      // Validate input
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        logger.error('Registration validation failed:', error.details);
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      logger.info('Registration validation passed');

      const {
        first_name,
        last_name,
        email,
        password,
        company_name,
        company_domain,
        industry,
        company_size,
        phone,
        timezone,
        referral_code,
        utm_source,
        utm_medium,
        utm_campaign
      } = value;

      // Check if user already exists
      logger.info('Checking if user exists:', { email });
      const existingUser = await models.User.findOne({ where: { email } });
      if (existingUser) {
        logger.warn('Registration failed - user already exists:', { email });
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Check for disposable email
      if (securityValidation.isDisposableEmail(email)) {
        logger.warn('Registration failed - disposable email:', { email });
        return res.status(400).json({
          success: false,
          error: 'Disposable email addresses are not allowed'
        });
      }

      // Check password strength
      const passwordStrength = securityValidation.checkPasswordStrength(password);
      if (passwordStrength.score < 4) {
        logger.warn('Registration failed - weak password:', { email, score: passwordStrength.score });
        return res.status(400).json({
          success: false,
          error: 'Password is too weak',
          feedback: passwordStrength.feedback
        });
      }

      logger.info('Starting database transaction');
      const transaction = await sequelize.transaction();

      try {
        // Create client
        logger.info('Creating client:', { company_name, email });
        
        // Generate slug from company name
        let slug = company_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50);
        
        if (!slug) {
          slug = 'client-' + Date.now();
        }
        
        const client = await models.Client.create({
          name: company_name,
          slug: slug,
          domain: company_domain,
          email: email,
          phone: phone,
          industry: industry,
          company_size: company_size,
          status: 'trial',
          settings: {
            timezone: timezone || 'UTC',
            currency: 'USD',
            language: 'en'
          },
          metadata: {
            utm_source,
            utm_medium,
            utm_campaign,
            referral_code,
            registration_ip: req.ip,
            registration_user_agent: req.get('User-Agent')
          }
        }, { transaction });

        logger.info('Client created successfully:', { clientId: client.id });

        // Create user
        logger.info('Creating user:', { email, clientId: client.id });
        const user = await models.User.create({
          client_id: client.id,
          email: email,
          password: password, // Will be hashed by model hook
          first_name: first_name,
          last_name: last_name,
          phone: phone,
          role: 'owner',
          status: 'pending', // Will become active after email verification
          preferences: {
            timezone: timezone || 'UTC',
            language: 'en'
          }
        }, { transaction });

        logger.info('User created successfully:', { userId: user.id });

        // Create free subscription
        logger.info('Creating free subscription');
        await models.Subscription.create({
          client_id: client.id,
          plan_name: 'free',
          status: 'trialing',
          amount: 0,
          trial_days: 14
        }, { transaction });

        logger.info('Subscription created successfully');

        await transaction.commit();
        logger.info('Transaction committed successfully');

        // Generate email verification token
        const verificationToken = jwtService.generateEmailVerificationToken(user.id);

        // Send welcome and verification emails
        try {
          await emailService.sendEmailVerification(user, verificationToken);
          logger.info('Verification email sent successfully');
        } catch (emailError) {
          logger.error('Failed to send verification email:', emailError);
          // Don't fail registration if email fails
        }

        // Log successful registration
        logger.logBusiness('user_registered', {
          userId: user.id,
          clientId: client.id,
          email: user.email,
          company: company_name,
          plan: 'free',
          source: utm_source,
          ip: req.ip
        });

        logger.info('Registration completed successfully');

        res.status(201).json({
          success: true,
          message: 'Registration successful. Please check your email to verify your account.',
          data: {
            user: {
              id: user.id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              status: user.status,
              email_verified: user.email_verified
            },
            client: {
              id: client.id,
              name: client.name,
              slug: client.slug,
              status: client.status
            },
            next_step: 'email_verification'
          }
        });

      } catch (dbError) {
        logger.error('Database error during registration:', dbError);
        await transaction.rollback();
        throw dbError;
      }

    } catch (error) {
      logger.error('Registration failed with error:', {
        message: error.message,
        stack: error.stack,
        email: req.body.email
      });
      
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req, res) => {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, remember_me, device_id, device_name } = value;

    // Find user with password
    const user = await models.User.scope('withPassword').findOne({
      where: { email },
      include: [{
        model: models.Client,
        as: 'client',
        include: [{
          model: models.Subscription,
          as: 'activeSubscription'
        }]
      }]
    });

    if (!user) {
      logger.logSecurity('login_attempt_invalid_email', 'medium', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      logger.logSecurity('login_attempt_invalid_password', 'medium', {
        userId: user.id,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check user status
    if (user.status !== 'active') {
      let message = 'Account is not active';
      let code = 'ACCOUNT_INACTIVE';

      if (user.status === 'pending') {
        message = 'Please verify your email address first';
        code = 'EMAIL_NOT_VERIFIED';
      } else if (user.status === 'suspended') {
        message = 'Account has been suspended';
        code = 'ACCOUNT_SUSPENDED';
      }

      return res.status(403).json({
        success: false,
        error: message,
        code
      });
    }

    // Check client status
    if (user.client.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended',
        code: 'CLIENT_SUSPENDED'
      });
    }

    try {
      // Generate device info
      const deviceInfo = {
        device_id: device_id,
        device_name: device_name,
        user_agent: req.get('User-Agent'),
        ip_address: req.ip,
        platform: 'web',
        browser: this.extractBrowserInfo(req.get('User-Agent')),
        os: this.extractOSInfo(req.get('User-Agent')),
        device_type: this.detectDeviceType(req.get('User-Agent'))
      };

      // Generate token pair
      const tokens = await jwtService.generateTokenPair(user, deviceInfo);

      // Update user login stats
      await user.update({
        last_login_at: new Date(),
        last_login_ip: req.ip,
        login_count: user.login_count + 1
      });

      // Log successful login
      logger.logAuth('user_login', user.id, user.client_id, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: device_id,
        sessionId: tokens.sessionId
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: user.getFullName(),
            role: user.role,
            avatar_url: user.avatar_url,
            preferences: user.preferences,
            last_login_at: user.last_login_at
          },
          client: {
            id: user.client.id,
            name: user.client.name,
            slug: user.client.slug,
            status: user.client.status,
            settings: user.client.settings
          },
          subscription: user.client.activeSubscription ? {
            plan_name: user.client.activeSubscription.plan_name,
            status: user.client.activeSubscription.status,
            features: user.client.activeSubscription.features
          } : null,
          tokens: {
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            token_type: tokens.tokenType,
            expires_in: tokens.expiresIn
          }
        }
      });

    } catch (error) {
      logger.error('Login token generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { refresh_token } = value;

    try {
      const result = await jwtService.refreshAccessToken(refresh_token);

      res.json({
        success: true,
        data: {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          token_type: result.tokenType,
          expires_in: result.expiresIn
        }
      });

    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req, res) => {
    try {
      const refreshToken = req.body.refresh_token;
      
      if (refreshToken) {
        await jwtService.revokeRefreshToken(refreshToken);
      }

      // Log logout
      if (req.user) {
        logger.logAuth('user_logout', req.user.id, req.user.client_id, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      
      // Still return success even if token revocation fails
      res.json({
        success: true,
        message: 'Logout successful'
      });
    }
  });

  /**
   * Forgot password - send reset email
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email } = value;

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, we sent you a password reset link.'
    };

    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      logger.logSecurity('password_reset_invalid_email', 'low', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.json(successResponse);
    }

    try {
      // Generate reset token
      const resetToken = jwtService.generatePasswordResetToken(user.id);

      // Send reset email
      await emailService.sendPasswordResetEmail(user, resetToken);

      logger.logAuth('password_reset_requested', user.id, user.client_id, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(successResponse);

    } catch (error) {
      logger.error('Password reset email failed:', error);
      res.json(successResponse); // Still return success
    }
  });

  /**
   * Reset password with token
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { token, password } = value;

    try {
      // Verify reset token
      const decoded = jwtService.verifyPasswordResetToken(token);
      const user = await models.User.findByPk(decoded.id);

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Check password strength
      const passwordStrength = securityValidation.checkPasswordStrength(password);
      if (passwordStrength.score < 4) {
        return res.status(400).json({
          success: false,
          error: 'Password is too weak',
          feedback: passwordStrength.feedback
        });
      }

      // Update password
      await user.update({ password });

      // Revoke all existing sessions for security
      await jwtService.revokeAllUserTokens(user.id, 'password_reset');

      // Send confirmation email
      try {
        await emailService.sendPasswordChangedNotification(user);
      } catch (emailError) {
        logger.error('Password changed notification failed:', emailError);
      }

      logger.logAuth('password_reset_completed', user.id, user.client_id, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Password reset successful. Please log in with your new password.'
      });

    } catch (error) {
      logger.error('Password reset failed:', error);
      
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }
  });

  /**
   * Change password (authenticated user)
   */
  changePassword = asyncHandler(async (req, res) => {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { current_password, new_password } = value;

    // Get user with password
    const user = await models.User.scope('withPassword').findByPk(req.user.id);

    // Verify current password
    const isValidPassword = await user.validatePassword(current_password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Check new password strength
    const passwordStrength = securityValidation.checkPasswordStrength(new_password);
    if (passwordStrength.score < 4) {
      return res.status(400).json({
        success: false,
        error: 'New password is too weak',
        feedback: passwordStrength.feedback
      });
    }

    // Update password
    await user.update({ password: new_password });

    // Revoke all other sessions
    await jwtService.revokeAllUserTokens(user.id, 'password_change');

    // Send notification email
    try {
      await emailService.sendPasswordChangedNotification(user);
    } catch (emailError) {
      logger.error('Password changed notification failed:', emailError);
    }

    logger.logAuth('password_changed', user.id, user.client_id, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * Verify email address
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { error, value } = verifyEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { token } = value;

    try {
      const decoded = jwtService.verifyEmailVerificationToken(token);
      const user = await models.User.findByPk(decoded.id);

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid verification token'
        });
      }

      if (user.email_verified) {
        return res.json({
          success: true,
          message: 'Email already verified'
        });
      }

      // Update user status
      await user.update({
        email_verified: true,
        status: 'active'
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        logger.error('Welcome email failed:', emailError);
      }

      logger.logAuth('email_verified', user.id, user.client_id, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification failed:', error);
      
      res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
  });

  /**
   * Resend verification email
   */
  resendVerification = asyncHandler(async (req, res) => {
    const { error, value } = resendVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email } = value;

    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, we sent you a verification link.'
      });
    }

    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'Email is already verified'
      });
    }

    try {
      const verificationToken = jwtService.generateEmailVerificationToken(user.id);
      await emailService.sendEmailVerification(user, verificationToken);

      res.json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      logger.error('Resend verification failed:', error);
      
      res.json({
        success: true,
        message: 'Verification email sent'
      });
    }
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await models.User.findByPk(req.user.id, {
      include: [{
        model: models.Client,
        as: 'client',
        include: [{
          model: models.Subscription,
          as: 'activeSubscription'
        }]
      }]
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.getFullName(),
          avatar_url: user.avatar_url,
          phone: user.phone,
          job_title: user.job_title,
          role: user.role,
          status: user.status,
          email_verified: user.email_verified,
          two_factor_enabled: user.two_factor_enabled,
          preferences: user.preferences,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        },
        client: {
          id: user.client.id,
          name: user.client.name,
          slug: user.client.slug,
          status: user.client.status,
          settings: user.client.settings
        },
        subscription: user.client.activeSubscription ? {
          plan_name: user.client.activeSubscription.plan_name,
          status: user.client.activeSubscription.status,
          features: user.client.activeSubscription.features,
          limits: user.client.activeSubscription.limits
        } : null
      }
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const user = await models.User.findByPk(req.user.id);
    await user.update(value);

    logger.logAuth('profile_updated', user.id, user.client_id, {
      ip: req.ip,
      changes: Object.keys(value)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  });

  // Helper methods
  extractBrowserInfo(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown';
  }

  extractOSInfo(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }

  detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPad/.test(userAgent)) return 'tablet';
      return 'mobile';
    }
    
    return 'desktop';
  }
}

module.exports = new AuthController();