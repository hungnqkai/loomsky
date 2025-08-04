/*
File: src/controllers/websiteController.js
    - Controller mới, chứa toàn bộ logic nghiệp vụ cho việc quản lý website và các tài nguyên con.
    - Đảm bảo mỗi thao tác đều kiểm tra quyền sở hữu (client_id).
*/
'use strict';
const { models } = require('../database');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

// Middleware helper để kiểm tra website có thuộc client của user không
const checkWebsiteOwnership = asyncHandler(async (req, res, next) => {
    const { websiteId } = req.params;
    const clientId = req.user.client_id;

    const website = await models.Website.findOne({
        where: { id: websiteId, client_id: clientId }
    });

    if (!website) {
        throw new AppError('Website not found or you do not have permission to access it.', 404);
    }

    req.website = website; // Gắn website vào request để các hàm sau sử dụng
    next();
});

const websiteController = {
    // === WEBSITE CONTROLLERS ===
    createWebsite: asyncHandler(async (req, res) => {
        const { name, domain, platform_type } = req.body;
        const client_id = req.user.client_id;

        const website = await models.Website.create({
            client_id,
            name,
            domain,
            platform_type,
        });

        res.status(201).json({ success: true, data: website });
    }),

    getWebsites: asyncHandler(async (req, res) => {
        const websites = await models.Website.findAll({
            where: { client_id: req.user.client_id },
            order: [['created_at', 'DESC']],
        });
        res.status(200).json({ success: true, data: websites });
    }),

    getWebsiteById: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        // req.website đã được lấy từ middleware checkWebsiteOwnership
        res.status(200).json({ success: true, data: req.website });
    })],

    updateWebsite: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { name, domain, platform_type } = req.body;
        const website = await req.website.update({ name, domain, platform_type });
        res.status(200).json({ success: true, data: website });
    })],

    deleteWebsite: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        await req.website.destroy();
        res.status(200).json({ success: true, message: 'Website deleted successfully.' });
    })],

    // === PIXEL CONTROLLERS ===
    addPixel: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { pixel_id, access_token, activation_rules, tracking_config } = req.body;
        const pixel = await models.Pixel.create({
            website_id: req.params.websiteId,
            pixel_id,
            access_token, // Cần mã hóa trước khi lưu vào DB trong thực tế
            activation_rules,
            tracking_config
        });
        res.status(201).json({ success: true, data: pixel });
    })],

    getPixels: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const pixels = await models.Pixel.findAll({ where: { website_id: req.params.websiteId } });
        res.status(200).json({ success: true, data: pixels });
    })],

    updatePixel: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { pixelId } = req.params;
        const pixel = await models.Pixel.findOne({ where: { id: pixelId, website_id: req.website.id }});
        if (!pixel) throw new AppError('Pixel not found.', 404);
        
        const updatedPixel = await pixel.update(req.body);
        res.status(200).json({ success: true, data: updatedPixel });
    })],

    deletePixel: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { pixelId } = req.params;
        const pixel = await models.Pixel.findOne({ where: { id: pixelId, website_id: req.website.id }});
        if (!pixel) throw new AppError('Pixel not found.', 404);

        await pixel.destroy();
        res.status(200).json({ success: true, message: 'Pixel deleted successfully.' });
    })],

    // === EVENT FILTER CONTROLLERS ===
    addEventFilter: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { event_name, rules } = req.body;
        const filter = await models.EventFilter.create({
            website_id: req.params.websiteId,
            event_name,
            rules
        });
        res.status(201).json({ success: true, data: filter });
    })],

    getEventFilters: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const filters = await models.EventFilter.findAll({ where: { website_id: req.params.websiteId } });
        res.status(200).json({ success: true, data: filters });
    })],

    updateEventFilter: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { filterId } = req.params;
        const filter = await models.EventFilter.findOne({ where: { id: filterId, website_id: req.website.id }});
        if (!filter) throw new AppError('Event filter not found.', 404);

        const updatedFilter = await filter.update(req.body);
        res.status(200).json({ success: true, data: updatedFilter });
    })],

    deleteEventFilter: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { filterId } = req.params;
        const filter = await models.EventFilter.findOne({ where: { id: filterId, website_id: req.website.id }});
        if (!filter) throw new AppError('Event filter not found.', 404);

        await filter.destroy();
        res.status(200).json({ success: true, message: 'Event filter deleted successfully.' });
    })],

    // === BLACKLIST CONTROLLERS ===
    addBlacklistEntry: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { type, value } = req.body;
        const entry = await models.Blacklist.create({
            website_id: req.params.websiteId,
            type,
            value
        });
        res.status(201).json({ success: true, data: entry });
    })],

    getBlacklist: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const list = await models.Blacklist.findAll({ where: { website_id: req.params.websiteId } });
        res.status(200).json({ success: true, data: list });
    })],

    deleteBlacklistEntry: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { blacklistId } = req.params;
        const entry = await models.Blacklist.findOne({ where: { id: blacklistId, website_id: req.website.id }});
        if (!entry) throw new AppError('Blacklist entry not found.', 404);

        await entry.destroy();
        res.status(200).json({ success: true, message: 'Blacklist entry deleted successfully.' });
    })],
};

module.exports = websiteController;