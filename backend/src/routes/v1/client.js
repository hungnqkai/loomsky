const express = require('express');
const clientController = require('../../controllers/clientController');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation'); // Cần cho validation
const Joi = require('joi'); // Cần cho validation
const upload = require('../../middleware/upload'); // Import middleware upload mới

const router = express.Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập.
// Chúng ta có thể đặt middleware ở đây để áp dụng cho tất cả.
router.use(authenticateToken);

/**
 * @route   GET /api/v1/clients/me
 * @desc    Get current client's details
 * @access  Private (All members)
 */
router.get('/me', clientController.getClientDetails);

/**
 * @route   PUT /api/v1/clients/me
 * @desc    Update current client's details
 * @access  Private (Owner, Admin)
 */
router.put(
  '/me',
  requireRole(['owner', 'admin']),
  validate({
    // SỬA LỖI: Đảm bảo tất cả các trường đều là .optional()
    body: Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      domain: Joi.string().uri().optional().allow(''),
      logo_url: Joi.string().uri().optional().allow(''),
      email: Joi.string().email().optional(),
      phone: Joi.string().min(10).max(20).optional().allow(''),
      address: Joi.string().max(255).optional().allow(''),
      city: Joi.string().max(100).optional().allow(''),
      country: Joi.string().max(100).optional().allow(''),
      postal_code: Joi.string().max(20).optional().allow(''),
      industry: Joi.string().max(100).optional().allow(''),
      company_size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').optional(),
      billing_email: Joi.string().email().optional().allow(''),
      tax_id: Joi.string().max(50).optional().allow(''),
      settings: Joi.object({
          timezone: Joi.string().optional(),
          language: Joi.string().optional(),
      }).optional(),
    }).min(1), // Vẫn yêu cầu có ít nhất một trường được gửi lên
  }),
  clientController.updateClientDetails
);

/**
 * @route   GET /api/v1/clients/me/members
 * @desc    Get all team members for the current user's client
 * @access  Private (All authenticated members of the client can access)
 */
router.get('/me/members', clientController.getTeamMembers);

/**
 * @route   POST /api/v1/clients/me/invitations
 * @desc    Invite a new member to the team
 * @access  Private (Owner, Admin)
 */
router.post(
  '/me/invitations',
  requireRole(['owner', 'admin']), // Chỉ owner và admin được mời
  // Thêm validation để đảm bảo dữ liệu gửi lên là hợp lệ
  validate({
    body: Joi.object({
      email: Joi.string().email().required(),
      role: Joi.string().valid('admin', 'member', 'viewer').required(),
    }),
  }),
  clientController.inviteTeamMember
);

/**
 * @route   PUT /api/v1/clients/me/members/:userId
 * @desc    Update a team member
 * @access  Private (Owner, Admin)
 */
router.put(
  '/me/members/:userId',
  requireRole(['owner', 'admin']), // Chỉ owner và admin được cập nhật
  validate({
    params: Joi.object({
      userId: Joi.string().uuid().required(),
    }),
    body: Joi.object({
      // Các trường đều là optional, nhưng ít nhất phải có 1 trường
      role: Joi.string().valid('admin', 'member', 'viewer').optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
    }).min(1).messages({ // .min(1) yêu cầu body không được rỗng
        'object.min': 'At least one field (role or status) must be provided for update.'
    }),
  }),
  clientController.updateTeamMember
);

/**
 * @route   DELETE /api/v1/clients/me/members/:userId
 * @desc    Remove a team member
 * @access  Private (Owner, Admin)
 */
router.delete(
  '/me/members/:userId',
  requireRole(['owner', 'admin']), // Chỉ owner và admin được xóa
  // Validate để đảm bảo userId là một UUID hợp lệ
  validate({
    params: Joi.object({
      userId: Joi.string().uuid().required(),
    }),
  }),
  clientController.deleteTeamMember
);

router.post(
  '/me/logo',
  requireRole(['owner', 'admin']),
  upload.single('logo'), // Sử dụng middleware multer, 'logo' là tên field trong form-data
  clientController.uploadClientLogo
);

module.exports = router;