/*
File: src/controllers/sdkController.js (CẬP NHẬT)
- Hoàn thiện logic cho hàm `getConfig` để tổng hợp và trả về cấu hình.
*/
'use strict';
const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

const sdkController = {
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
                { model: models.Pixel },
                { model: models.EventFilter },
                { model: models.Blacklist },
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

        const config = {
            websiteId: website.id,
            planFeatures: planFeatures,
            pixels: website.Pixels || [],
            eventFilters: website.EventFilters || [],
            blacklist: website.Blacklist || [],
        };

        res.status(200).json({ success: true, data: config });
    }),
};

module.exports = sdkController;