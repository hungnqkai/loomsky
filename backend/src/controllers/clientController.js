const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const emailService = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

const clientController = {
    /**
     * @desc    Get all team members for the current user's client
     * @route   GET /api/v1/clients/me/members
     * @access  Private
     */
    getTeamMembers: asyncHandler(async (req, res) => {
        // Middleware `authenticateToken` đã đảm bảo req.user tồn tại
        const clientId = req.user.client_id;

        const members = await models.User.findAll({
        where: {
            client_id: clientId,
        },
        // Chỉ lấy những thuộc tính cần thiết để hiển thị ở frontend
        attributes: [
            'id',
            'first_name',
            'last_name',
            'email',
            'role',
            'status',
            'last_login_at',
        ],
        order: [['created_at', 'ASC']], // Sắp xếp theo người dùng cũ nhất
        });

        res.status(200).json({
        success: true,
        count: members.length,
        data: members,
        });
    }),

    /**
     * @desc    Invite a new member to the team
     * @route   POST /api/v1/clients/me/invitations
     * @access  Private (Owner, Admin)
     */
    inviteTeamMember: asyncHandler(async (req, res) => {
        const { email, role } = req.body;
        const inviter = req.user;
        const client = req.client;

        // --- 1. Kiểm tra giới hạn của gói cước ---
        const subscription = client.activeSubscription;
        if (!subscription || !subscription.plan || !subscription.plan.features) {
        return res.status(403).json({
            success: false,
            error: 'Subscription information is missing. Cannot process invitation.',
        });
        }

        const limit = subscription.plan.features.team_members_limit || 0;

        const currentMemberCount = await models.User.count({
        where: {
            client_id: client.id,
            // Đếm cả những người đã được mời nhưng chưa chấp nhận
            status: ['active', 'pending'],
        },
        });

        if (currentMemberCount >= limit) {
        return res.status(403).json({
            success: false,
            error: `Team member limit of ${limit} reached. Please upgrade your plan to invite more members.`,
        });
        }

        // --- 2. Kiểm tra các điều kiện khác ---
        // Kiểm tra xem email đã tồn tại trong client này chưa
        const existingUser = await models.User.findOne({
        where: { email, client_id: client.id },
        });

        if (existingUser) {
        return res.status(409).json({
            success: false,
            error: 'A user with this email already exists in your team.',
        });
        }
        
        // Owner không thể mời Owner khác
        if (role === 'owner') {
            return res.status(400).json({
                success: false,
                error: 'Cannot invite a user with the "owner" role.',
            });
        }

        // --- 3. Tạo lời mời ---
        const invitationToken = uuidv4(); // Tạo token mời duy nhất
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Lời mời hết hạn sau 7 ngày

        const invitedUser = await models.User.create({
        client_id: client.id,
        email,
        role,
        status: 'pending', // Trạng thái chờ chấp nhận lời mời
        password: `pending_invitation_${uuidv4()}`, // Mật khẩu tạm, sẽ được đặt lại khi chấp nhận
        first_name: 'Invited', // Tên tạm
        last_name: 'User',
        invited_by: inviter.id,
        invitation_token: invitationToken,
        invitation_expires: invitationExpires,
        });

        // --- 4. Gửi Email ---
        await emailService.sendTeamInvitationEmail(
        invitedUser,
        inviter,
        client,
        invitationToken
        );

        res.status(201).json({
        success: true,
        message: `Invitation sent successfully to ${email}.`,
        });
    }),

    /**
     * @desc    Remove a team member
     * @route   DELETE /api/v1/clients/me/members/:userId
     * @access  Private (Owner, Admin)
     */
    deleteTeamMember: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const remover = req.user; // Người thực hiện hành động xóa
        const clientId = req.user.client_id;

        // --- 1. Logic nghiệp vụ và kiểm tra quyền ---
        if (remover.id === userId) {
        return res.status(400).json({
            success: false,
            error: 'You cannot remove yourself from the team.',
        });
        }

        const memberToDelete = await models.User.findOne({
        where: {
            id: userId,
            client_id: clientId, // Đảm bảo thành viên này thuộc đúng client
        },
        });

        if (!memberToDelete) {
        return res.status(404).json({
            success: false,
            error: 'Team member not found in your client.',
        });
        }

        // Admin không thể xóa Owner
        if (memberToDelete.role === 'owner') {
        return res.status(403).json({
            success: false,
            error: 'Cannot remove the owner of the team.',
        });
        }

        // --- 2. Thực hiện xóa ---
        // Sử dụng soft delete (paranoid: true trong model)
        await memberToDelete.destroy();

        // Tùy chọn: Gửi email thông báo cho người dùng đã bị xóa (có thể không cần thiết)
        // await emailService.sendRemovedFromTeamEmail(memberToDelete, remover);

        res.status(200).json({
        success: true,
        message: 'Team member removed successfully.',
        });
    }),

    /**
     * @desc    Accept a team invitation
     * @route   POST /api/v1/invitations/accept
     * @access  Public
     */
    acceptInvitation: asyncHandler(async (req, res) => {
        const { token, first_name, last_name, password } = req.body;

        // 1. Tìm người dùng bằng token
        const user = await models.User.findOne({
        where: {
            invitation_token: token,
            status: 'pending', // Chỉ tìm những lời mời chưa được chấp nhận
        },
        });

        // 2. Validate token
        if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Invitation not found or already accepted.',
        });
        }

        if (user.invitation_expires < new Date()) {
        return res.status(400).json({
            success: false,
            error: 'Invitation has expired. Please ask your team admin to send a new one.',
        });
        }

        // 3. Cập nhật thông tin người dùng
        user.first_name = first_name;
        user.last_name = last_name;
        user.password = password; // Hook `beforeUpdate` trong model sẽ tự động hash mật khẩu
        user.status = 'active';
        user.email_verified = true; // Coi như email đã được xác thực vì lời mời được gửi đến đó
        user.accepted_invitation_at = new Date();
        user.invitation_token = null; // Xóa token sau khi sử dụng
        user.invitation_expires = null;

        await user.save();

        // 4. (Tùy chọn nhưng khuyến khích) Tự động đăng nhập người dùng
        // Nếu bạn muốn người dùng được tự động đăng nhập ngay sau khi chấp nhận,
        // bạn có thể tạo và trả về một cặp token ở đây.

        res.status(200).json({
        success: true,
        message: 'Invitation accepted successfully! You can now log in.',
        });
    }),

    /**
     * @desc    Get details of the current user's client
     * @route   GET /api/v1/clients/me
     * @access  Private
     */
    getClientDetails: asyncHandler(async (req, res) => {
        // Middleware `authenticateToken` đã gắn `req.client` vào request
        // Chúng ta chỉ cần trả về thông tin đó
        res.status(200).json({
        success: true,
        data: req.client,
        });
    }),

    /**
     * @desc    Update details of the current user's client
     * @route   PUT /api/v1/clients/me
     * @access  Private (Owner, Admin)
     */
    updateClientDetails: asyncHandler(async (req, res) => {
        const client = await models.Client.findByPk(req.user.client_id);

        if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found.' });
        }

        // Mở rộng danh sách các trường cho phép cập nhật
        const allowedUpdates = [
        'name', 'domain', 'logo_url', 'email', 'phone',
        'address', 'city', 'country', 'postal_code',
        'industry', 'company_size', 'billing_email', 'tax_id'
        ];
        const updates = {};

        for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
        }
        
        // Xử lý cập nhật cho trường JSON 'settings'
        if (req.body.settings && typeof req.body.settings === 'object') {
            updates.settings = { ...client.settings, ...req.body.settings };
        }

        await client.update(updates);

        res.status(200).json({
        success: true,
        message: 'Client details updated successfully.',
        data: client,
        });
    }),

    /**
     * @desc    Upload a logo for the client
     * @route   POST /api/v1/clients/me/logo
     * @access  Private (Owner, Admin)
     */
    uploadClientLogo: asyncHandler(async (req, res) => {
        const client = await models.Client.findByPk(req.user.client_id);

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        // URL sẽ là đường dẫn tĩnh đến file đã upload
        const logoUrl = `/uploads/logos/${req.file.filename}`;

        await client.update({ logo_url: logoUrl });

        res.status(200).json({
            success: true,
            message: 'Logo uploaded successfully.',
            data: {
                logo_url: logoUrl
            }
        });
    }),
};

module.exports = clientController;