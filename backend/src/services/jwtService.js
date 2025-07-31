// backend/src/services/jwtService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

class JWTService {
  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        clientId: payload.client_id || payload.clientId,
        role: payload.role,
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expire,
        issuer: 'loomsky',
        audience: 'loomsky-app'
      });
    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    try {
      const tokenPayload = {
        id: userId,
        type: 'refresh',
        jti: crypto.randomUUID(), // JWT ID for token rotation
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpire,
        issuer: 'loomsky',
        audience: 'loomsky-refresh'
      });
    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'loomsky',
        audience: 'loomsky-app'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('ACCESS_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_ACCESS_TOKEN');
      } else {
        logger.error('Access token verification failed:', error);
        throw new Error('TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'loomsky',
        audience: 'loomsky-refresh'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_REFRESH_TOKEN');
      } else {
        logger.error('Refresh token verification failed:', error);
        throw new Error('TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  async generateTokenPair(user, sessionData = {}) {
    try {
      const { models } = require('../database');
      
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user.id);

      // Create user session with refresh token
      const session = await models.UserSession.createSession(user, {
        ...sessionData,
        refresh_token: refreshToken
      });

      return {
        accessToken,
        refreshToken,
        sessionId: session.id,
        expiresIn: this.getTokenExpiration(config.jwt.expire),
        tokenType: 'Bearer'
      };
    } catch (error) {
      logger.error('Failed to generate token pair:', error);
      throw new Error('Token pair generation failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, sessionData = {}) {
    try {
      const { models } = require('../database');
      
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Find and validate session
      const session = await models.UserSession.findByRefreshToken(refreshToken);
      if (!session || !session.isActive()) {
        throw new Error('INVALID_SESSION');
      }

      // Update session activity
      await session.updateLastUsed();

      // Generate new access token
      const accessToken = this.generateAccessToken(session.user);

      // Optionally rotate refresh token for enhanced security
      let newRefreshToken = refreshToken;
      if (this.shouldRotateRefreshToken(session)) {
        newRefreshToken = this.generateRefreshToken(session.user.id);
        session.refresh_token = newRefreshToken;
        await session.save();
      }

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getTokenExpiration(config.jwt.expire),
        tokenType: 'Bearer',
        user: session.user
      };
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(refreshToken) {
    try {
      const { models } = require('../database');
      
      const session = await models.UserSession.findByRefreshToken(refreshToken);
      if (session) {
        await session.revoke('user_logout');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserTokens(userId, reason = 'password_change') {
    try {
      const { models } = require('../database');
      
      const revokedCount = await models.UserSession.revokeAllUserSessions(userId, reason);
      logger.info(`Revoked ${revokedCount} sessions for user ${userId}`, { reason });
      return revokedCount;
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      throw error;
    }
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpiration(expireString) {
    const match = expireString.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const [, amount, unit] = match;
    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    return parseInt(amount) * multipliers[unit];
  }

  /**
   * Check if refresh token should be rotated
   */
  shouldRotateRefreshToken(session) {
    // Rotate if session is older than 1 day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return session.created_at < oneDayAgo;
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId) {
    try {
      const tokenPayload = {
        id: userId,
        type: 'password_reset',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: '1h', // Password reset tokens expire in 1 hour
        issuer: 'loomsky',
        audience: 'loomsky-reset'
      });
    } catch (error) {
      logger.error('Failed to generate password reset token:', error);
      throw new Error('Password reset token generation failed');
    }
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'loomsky',
        audience: 'loomsky-reset'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('RESET_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_RESET_TOKEN');
      } else {
        logger.error('Password reset token verification failed:', error);
        throw new Error('TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(userId) {
    try {
      const tokenPayload = {
        id: userId,
        type: 'email_verification',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: '24h', // Email verification tokens expire in 24 hours
        issuer: 'loomsky',
        audience: 'loomsky-verify'
      });
    } catch (error) {
      logger.error('Failed to generate email verification token:', error);
      throw new Error('Email verification token generation failed');
    }
  }

  /**
   * Verify email verification token
   */
  verifyEmailVerificationToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'loomsky',
        audience: 'loomsky-verify'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('VERIFICATION_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_VERIFICATION_TOKEN');
      } else {
        logger.error('Email verification token verification failed:', error);
        throw new Error('TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Failed to decode token:', error);
      return null;
    }
  }
}

module.exports = new JWTService();