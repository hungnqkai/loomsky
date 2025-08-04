/*
File: src/controllers/trackController.js (MỚI)
- Controller chứa logic nghiệp vụ cốt lõi để xử lý sự kiện.
*/
'use strict';
const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

const trackController = {
    /**
     * @desc    Receive and process a tracking event from the SDK
     * @route   POST /api/v1/track/event
     * @access  Public (via API Key)
     */
    trackEvent: asyncHandler(async (req, res) => {
        const { apiKey, eventName, properties, sessionId, timestamp, pixel_id, event_id } = req.body;

        // 1. Xác thực API Key và lấy thông tin website
        const website = await models.Website.findOne({
            where: { api_key: apiKey },
            include: {
                model: models.Client,
                attributes: ['id'],
                include: {
                    model: models.Subscription,
                    as: 'activeSubscription',
                    include: {
                        model: models.SubscriptionPlan,
                        as: 'plan',
                        attributes: ['features']
                    }
                }
            }
        });

        if (!website) {
            throw new AppError('Invalid API Key.', 403);
        }

        // 2. Lớp 2: Kiểm tra Giới hạn Gói cước (Usage Limit Check)
        const monthlyLimit = website.Client?.activeSubscription?.plan?.features?.capi?.monthly_limit || 0;
        // Logic đếm số sự kiện trong tháng sẽ được thêm ở đây.
        // Nếu vượt quá, throw new AppError('Usage limit exceeded.', 429);
        
        // 3. Xử lý Session: Tìm hoặc tạo mới
        const [session, isNewSession] = await models.Session.findOrCreate({
            where: { id: sessionId },
            defaults: {
                id: sessionId,
                website_id: website.id,
                ls_user_id: properties.user.ls_user_id,
                start_time: timestamp,
                end_time: timestamp, // Sẽ được cập nhật sau
                ip_address: req.ip,
                device_info: { userAgent: properties.user.user_agent },
                attribution_source: {}, // Sẽ được làm giàu sau
                landing_page: properties.context.page_url,
            }
        });

        if (!isNewSession) {
            // Cập nhật thời gian kết thúc của session
            session.end_time = timestamp;
            await session.save();
        }

        // 4. Lưu Sự kiện
        await models.Event.create({
            session_id: session.id,
            event_name: eventName,
            properties: properties,
            timestamp: timestamp,
        });

        // 5. Đẩy vào Queue để xử lý CAPI (sẽ làm ở Phase 2)
        // const pixel = await models.Pixel.findOne({ where: { website_id: website.id, pixel_id: pixel_id }});
        // if (pixel && pixel.access_token) {
        //   // Đẩy job vào Bull Queue với đầy đủ thông tin
        // }
        
        // 6. Phản hồi 202 Accepted
        res.status(202).json({ success: true, message: 'Event accepted.' });
    }),
};

module.exports = trackController;