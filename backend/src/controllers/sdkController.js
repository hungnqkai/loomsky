/*
File: src/controllers/sdkController.js (CẬP NHẬT)
- Hoàn thiện logic cho hàm `getConfig` để tổng hợp và trả về cấu hình.
*/
'use strict';
const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { redisUtils } = require('../config/redis'); // Import redis utils
const { v4: uuidv4 } = require('uuid'); // Import UUID for token generation

const sdkController = {

    /**
     * @desc    (MỚI) Khởi tạo một phiên thiết lập và trả về token
     * @route   POST /api/v1/sdk/init-setup
     * @access  Private (Yêu cầu đăng nhập)
     */
    initSetupSession: asyncHandler(async (req, res) => {
        const { websiteId, pixelId, setupType } = req.body;
        const clientId = req.user.client_id;

        // Kiểm tra website có thuộc sở hữu của client không
        const website = await models.Website.findOne({ where: { id: websiteId, client_id: clientId } });
        if (!website) {
            throw new AppError('Website not found or you do not have permission.', 404);
        }

        // Nếu có pixelId, kiểm tra pixel có thuộc website không
        if (pixelId) {
            const pixel = await models.Pixel.findOne({ 
                where: { 
                    id: pixelId,
                    website_id: websiteId 
                } 
            });
            if (!pixel) {
                throw new AppError('Pixel not found or does not belong to this website.', 404);
            }
        }

        // Tạo token duy nhất, dùng một lần
        const token = uuidv4();
        const redisKey = `setup_token:${token}`;
        const tokenData = {
            websiteId: website.id,
            pixelId: pixelId || null,
            setupType: setupType || 'mapper', // 'mapper' or 'triggers'
            clientId: clientId,
            userId: req.user.id,
        };
        const fiveMinutesInSeconds = 5 * 60;

        // Lưu token vào Redis với thời gian hết hạn là 5 phút
        await redisUtils.setex(redisKey, fiveMinutesInSeconds, tokenData);

        res.status(200).json({
            success: true,
            message: 'Setup session initialized.',
            data: {
                setup_token: token,
            },
        });
    }),

    /**
     * @desc    (MỚI) Xác thực setup_token từ SDK
     * @route   POST /api/v1/sdk/verify-setup
     * @access  Public (SDK gọi)
     */
    verifySetupSession: asyncHandler(async (req, res) => {
        const { token } = req.body;
        const redisKey = `setup_token:${token}`;

        // Lấy dữ liệu từ Redis
        const tokenData = await redisUtils.get(redisKey);

        if (!tokenData) {
            throw new AppError('Invalid or expired setup token.', 401);
        }

        // Xóa token ngay sau khi sử dụng để đảm bảo nó chỉ được dùng một lần
        await redisUtils.del(redisKey);

        res.status(200).json({
            success: true,
            message: 'Token verified successfully.',
            data: {
                websiteId: tokenData.websiteId,
                pixelId: tokenData.pixelId,
                setupType: tokenData.setupType,
            },
        });
    }),
    
    verifyApiKey: asyncHandler(async (req, res) => {
        const { apiKey } = req.body;
        const website = await models.Website.findOne({ where: { api_key: apiKey } });
        if (!website) {
            throw new AppError('Invalid API Key.', 404);
        }
        res.status(200).json({ 
            success: true, 
            message: 'API Key is valid and connection is successful.',
            data: { websiteId: website.id, websiteName: website.name }
        });
    }),

    /**
     * @desc    Get tracking configuration for a website
     * @route   GET /api/v1/sdk/config
     * @access  Public (via API Key in query string)
     */
    getConfig: asyncHandler(async (req, res) => {
        const { apiKey } = req.query;

        if (!apiKey) {
            throw new AppError('API Key is required.', 400);
        }

        const website = await models.Website.findOne({
            where: { api_key: apiKey },
            // Dùng eager loading để lấy tất cả dữ liệu liên quan trong 1 câu lệnh query
            include: [
                { 
                    model: models.Pixel,
                    include: [{
                        model: models.EventTrigger,
                        as: 'event_triggers',
                        where: { enabled: true },
                        required: false
                    }]
                },
                { model: models.EventFilter },
                { model: models.Blacklist },
                { model: models.DataMapping },
                {
                    model: models.Client,
                    attributes: ['id'],
                    include: {
                        model: models.Subscription,
                        as: 'activeSubscription',
                        attributes: ['id', 'status'],
                        include: {
                            model: models.SubscriptionPlan,
                            as: 'plan',
                            attributes: ['features']
                        }
                    }
                }
            ]
        });

        if (!website) {
            throw new AppError('Website not found for the provided API Key.', 404);
        }

        // Trích xuất và định dạng lại dữ liệu
        const planFeatures = website.Client?.activeSubscription?.plan?.features || {};

        // Process pixels with triggers grouped by type for SDK efficiency
        const processedPixels = (website.Pixels || []).map(pixel => ({
            ...pixel.toJSON(),
            event_triggers: {
                url_triggers: pixel.event_triggers?.filter(t => t.trigger_type === 'url_match') || [],
                click_triggers: pixel.event_triggers?.filter(t => t.trigger_type === 'click_element') || []
            }
        }));

        const config = {
            websiteId: website.id,
            planFeatures: planFeatures,
            pixels: processedPixels,
            eventFilters: website.EventFilters || [],
            blacklist: website.Blacklist || [],
            dataMappings: website.DataMappings || [],
        };

        res.status(200).json({ success: true, data: config });
    }),
};

module.exports = sdkController;