// backend/src/validators/authValidators.js
const Joi = require('joi');

// Password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must contain at least 8 characters with uppercase, lowercase, and number')
  .required();

// Email validation schema
const emailSchema = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: true } })
  .max(255)
  .lowercase()
  .required();

// Name validation schema
const nameSchema = Joi.string()
  .trim()
    .min(1)
    .max(50)
    .pattern(/^[\p{L}\p{M}\s'-]+$/u) // Hỗ trợ Unicode
    .required()
    .messages({
      'string.pattern.base': 'Họ chỉ có thể chứa chữ cái, khoảng trắng, dấu gạch nối và dấu nháy đơn.',
    })

/**
 * User registration validation
 */
const registerSchema = Joi.object({
  // Personal Information
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  
  // Company Information
  company_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),
    
  company_domain: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
    
  industry: Joi.string()
    .max(100)
    .optional(),
    
  company_size: Joi.string()
    .valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
    .optional(),
    
  // Contact Information
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .min(10)
    .max(20)
    .optional(),
    
  // Terms and conditions
  terms_accepted: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms and conditions'
    }),
    
  marketing_consent: Joi.boolean()
    .default(false)
    .optional(),
    
  // Timezone and locale
  timezone: Joi.string()
    .max(100)
    .default('UTC')
    .optional(),
    
  // Referral tracking
  referral_code: Joi.string()
    .alphanum()
    .max(50)
    .optional(),
    
  utm_source: Joi.string()
    .max(100)
    .optional(),
    
  utm_medium: Joi.string()
    .max(100)
    .optional(),
    
  utm_campaign: Joi.string()
    .max(100)
    .optional()
});

/**
 * User login validation
 */
const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
  remember_me: Joi.boolean().default(false),
  device_id: Joi.string().max(100).optional(),
  device_name: Joi.string().max(100).optional()
});

/**
 * Password reset request validation
 */
const forgotPasswordSchema = Joi.object({
  email: emailSchema
});

/**
 * Password reset validation
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema,
  password_confirmation: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation must match password'
    })
});

/**
 * Change password validation
 */
const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: passwordSchema,
  new_password_confirmation: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Password confirmation must match new password'
    })
});

/**
 * Refresh token validation
 */
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
  device_id: Joi.string().max(100).optional()
});

/**
 * Email verification validation
 */
const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

/**
 * Resend verification email validation
 */
const resendVerificationSchema = Joi.object({
  email: emailSchema
});

/**
 * Update profile validation
 */
const updateProfileSchema = Joi.object({
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .min(10)
    .max(20)
    .allow('')
    .optional(),
  job_title: Joi.string()
    .max(100)
    .allow('')
    .optional(),
  avatar_url: Joi.string()
    .uri()
    .allow('')
    .optional(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').optional(),
    language: Joi.string().max(10).optional(),
    timezone: Joi.string().max(100).optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      browser: Joi.boolean().optional(),
      weekly_reports: Joi.boolean().optional(),
      ab_test_results: Joi.boolean().optional(),
      system_alerts: Joi.boolean().optional()
    }).optional(),
    dashboard: Joi.object({
      default_date_range: Joi.string().valid('24h', '7d', '30d', '90d').optional(),
      show_tour: Joi.boolean().optional(),
      collapsed_sidebar: Joi.boolean().optional()
    }).optional()
  }).optional()
});

/**
 * Team invitation validation
 */
const inviteTeamMemberSchema = Joi.object({
  email: emailSchema,
  role: Joi.string()
    .valid('admin', 'member', 'viewer')
    .required(),
  permissions: Joi.object({
    dashboard: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    analytics: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    journey: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    abtest: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    integrations: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    settings: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    team: Joi.array().items(Joi.string().valid('read', 'write')).optional(),
    billing: Joi.array().items(Joi.string().valid('read', 'write')).optional()
  }).optional(),
  message: Joi.string()
    .max(500)
    .optional()
});

/**
 * Accept invitation validation
 */
const acceptInvitationSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema,
  password_confirmation: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation must match password'
    }),
  first_name: nameSchema,
  last_name: nameSchema,
  terms_accepted: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms and conditions'
    })
});

/**
 * Two-factor authentication setup validation
 */
const setupTwoFactorSchema = Joi.object({
  password: Joi.string().required()
});

/**
 * Two-factor authentication verification validation
 */
const verifyTwoFactorSchema = Joi.object({
  token: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required(),
  backup_code: Joi.string()
    .length(8)
    .alphanum()
    .optional()
}).xor('token', 'backup_code'); // Either token or backup_code, not both

/**
 * Disable two-factor authentication validation
 */
const disableTwoFactorSchema = Joi.object({
  password: Joi.string().required(),
  token: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .optional(),
  backup_code: Joi.string()
    .length(8)
    .alphanum()
    .optional()
}).or('token', 'backup_code'); // Either token or backup_code required

/**
 * Session management validation
 */
const revokeSessionSchema = Joi.object({
  session_id: Joi.string()
    .uuid()
    .required()
});

/**
 * Device information validation
 */
const deviceInfoSchema = Joi.object({
  device_id: Joi.string().max(100).optional(),
  device_name: Joi.string().max(100).optional(),
  device_type: Joi.string()
    .valid('desktop', 'mobile', 'tablet')
    .optional(),
  browser: Joi.string().max(100).optional(),
  os: Joi.string().max(100).optional(),
  user_agent: Joi.string().max(500).optional(),
  timezone: Joi.string().max(100).optional()
});

/**
 * Security validation helpers
 */
const securityValidation = {
  // Check if email is from a disposable email provider
  isDisposableEmail(email) {
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com'
      // Add more as needed
    ];
    
    const domain = email.split('@')[1];
    return disposableDomains.includes(domain);
  },

  // Check password strength
  checkPasswordStrength(password) {
    const strength = {
      score: 0,
      feedback: []
    };

    if (password.length >= 8) strength.score += 1;
    if (password.length >= 12) strength.score += 1;
    if (/[a-z]/.test(password)) strength.score += 1;
    if (/[A-Z]/.test(password)) strength.score += 1;
    if (/\d/.test(password)) strength.score += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength.score += 1;

    if (strength.score < 4) {
      strength.feedback.push('Password is too weak');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      strength.feedback.push('Avoid repeated characters');
    }

    if (/^[a-zA-Z]+\d+$/.test(password)) {
      strength.feedback.push('Avoid simple patterns like word+numbers');
    }

    return strength;
  },

  // Rate limiting validation
  rateLimitSchema: Joi.object({
    identifier: Joi.string().required(),
    max_attempts: Joi.number().integer().min(1).default(5),
    window_minutes: Joi.number().integer().min(1).default(15),
    block_duration_minutes: Joi.number().integer().min(1).default(30)
  })
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  inviteTeamMemberSchema,
  acceptInvitationSchema,
  setupTwoFactorSchema,
  verifyTwoFactorSchema,
  disableTwoFactorSchema,
  revokeSessionSchema,
  deviceInfoSchema,
  securityValidation,
  
  // Re-export individual schemas for convenience
  passwordSchema,
  emailSchema,
  nameSchema
};