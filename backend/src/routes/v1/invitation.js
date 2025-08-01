const express = require('express');
// Sửa đổi: import clientController vì hàm acceptInvitation đang ở đó
const clientController = require('../../controllers/clientController'); 
const { validate } = require('../../middleware/validation');
const Joi = require('joi');

const router = express.Router();

/**
 * @route   POST /api/v1/invitations/accept
 * @desc    Accept a team invitation
 * @access  Public
 */
router.post(
  '/accept',
  validate({
    body: Joi.object({
      token: Joi.string().uuid().required(),
      first_name: Joi.string().min(1).max(50).required(),
      last_name: Joi.string().min(1).max(50).required(),
      // Thêm validation cho password
      password: Joi.string().min(8).required(),
    }),
  }),
  clientController.acceptInvitation
);

module.exports = router;