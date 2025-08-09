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

        // Lấy stats cho từng website
        const websitesWithStats = await Promise.all(websites.map(async (website) => {
            const websiteId = website.id;
            
            try {
                // Đếm số lượng các tài nguyên
                const [pixelCount, eventCount, filterCount, blacklistCount] = await Promise.all([
                    models.Pixel.count({ where: { website_id: websiteId } }).catch(() => 0),
                    models.Event.count({
                        include: [{
                            model: models.Session,
                            where: { website_id: websiteId },
                            attributes: []
                        }]
                    }).catch(() => 0),
                    models.EventFilter.count({ where: { website_id: websiteId } }).catch(() => 0),
                    models.Blacklist.count({ where: { website_id: websiteId } }).catch(() => 0)
                ]);

                // Lấy activity gần nhất và trạng thái kết nối
                const [latestEvent, latestSession] = await Promise.all([
                    models.Event.findOne({
                        include: [{
                            model: models.Session,
                            where: { website_id: websiteId },
                            attributes: []
                        }],
                        order: [['created_at', 'DESC']],
                        attributes: ['created_at']
                    }).catch(() => null),
                    models.Session.findOne({
                        where: { website_id: websiteId },
                        order: [['updated_at', 'DESC']],
                        attributes: ['updated_at']
                    }).catch(() => null)
                ]);

            // Xác định last_activity và connection status
            let lastActivity = null;
            let isConnected = false;
            
            try {
                if (latestEvent || latestSession) {
                    const eventTime = latestEvent?.created_at ? new Date(latestEvent.created_at) : null;
                    const sessionTime = latestSession?.updated_at ? new Date(latestSession.updated_at) : null;
                    
                    // Kiểm tra tính hợp lệ của dates
                    const validEventTime = eventTime && !isNaN(eventTime.getTime()) ? eventTime : null;
                    const validSessionTime = sessionTime && !isNaN(sessionTime.getTime()) ? sessionTime : null;
                    
                    if (validEventTime && validSessionTime) {
                        lastActivity = validEventTime > validSessionTime ? validEventTime : validSessionTime;
                    } else if (validEventTime) {
                        lastActivity = validEventTime;
                    } else if (validSessionTime) {
                        lastActivity = validSessionTime;
                    }
                }

                // Connected nếu có activity trong 5 phút gần đây
                if (lastActivity) {
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    isConnected = lastActivity > fiveMinutesAgo;
                }
            } catch (error) {
                console.error(`Error processing dates for website ${websiteId}:`, error);
                lastActivity = null;
                isConnected = false;
            }

            // Chuyển website thành plain object và thêm stats
            const websiteData = website.toJSON();
                return {
                    ...websiteData,
                    pixels_count: pixelCount || 0,
                    events_count: eventCount || 0,
                    filters_count: filterCount || 0,
                    blacklist_count: blacklistCount || 0,
                    last_activity: lastActivity ? lastActivity.toISOString() : null,
                    is_connected: Boolean(isConnected),
                    connection_status: isConnected ? 'connected' : 'disconnected'
                };
            } catch (error) {
                console.error(`Error processing stats for website ${websiteId}:`, error);
                // Return website with default stats if processing fails
                const websiteData = website.toJSON();
                return {
                    ...websiteData,
                    pixels_count: 0,
                    events_count: 0,
                    filters_count: 0,
                    blacklist_count: 0,
                    last_activity: null,
                    is_connected: false,
                    connection_status: 'disconnected'
                };
            }
        }));

        res.status(200).json({ success: true, data: websitesWithStats });
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

    // === DATA MAPPING CONTROLLERS (MỚI) ===
    getDataMappings: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const mappings = await models.DataMapping.findAll({
            where: { website_id: req.params.websiteId },
            order: [['created_at', 'DESC']]
        });
        res.status(200).json({ success: true, data: mappings });
    })],

    addDataMapping: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { variable_name, selector, page_context } = req.body;
        const mapping = await models.DataMapping.create({
            website_id: req.params.websiteId,
            variable_name,
            selector,
            page_context
        });
        res.status(201).json({ success: true, data: mapping });
    })],

    deleteDataMapping: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const { mapId } = req.params;
        const mapping = await models.DataMapping.findOne({
            where: { id: mapId, website_id: req.website.id }
        });

        if (!mapping) {
            throw new AppError('Data mapping not found.', 404);
        }

        await mapping.destroy();
        res.status(200).json({ success: true, message: 'Data mapping deleted successfully.' });
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

    // === CONNECTION STATUS & DASHBOARD STATS CONTROLLERS ===
    getConnectionStatus: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const websiteId = req.website.id;
        
        // Kiểm tra session gần nhất để xác định trạng thái kết nối
        const latestSession = await models.Session.findOne({
            where: { website_id: websiteId },
            order: [['updated_at', 'DESC']]
        });

        // Kiểm tra event gần nhất thông qua Session (vì Event không có website_id trực tiếp)
        const latestEvent = await models.Event.findOne({
            include: [{
                model: models.Session,
                where: { website_id: websiteId },
                attributes: []
            }],
            order: [['created_at', 'DESC']]
        });

        let connected = false;
        let lastSeen = null;
        let method = 'unknown';
        
        // Xác định trạng thái kết nối dựa trên activity trong 5 phút gần đây
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (latestSession || latestEvent) {
            // Validate and create date objects safely
            let sessionTime = null;
            let eventTime = null;
            
            if (latestSession && latestSession.updated_at) {
                const tempSessionTime = new Date(latestSession.updated_at);
                sessionTime = !isNaN(tempSessionTime.getTime()) ? tempSessionTime : null;
            }
            
            if (latestEvent && latestEvent.created_at) {
                const tempEventTime = new Date(latestEvent.created_at);
                eventTime = !isNaN(tempEventTime.getTime()) ? tempEventTime : null;
            }
            
            // Lấy thời gian mới nhất
            lastSeen = sessionTime && eventTime 
                ? (sessionTime > eventTime ? sessionTime : eventTime)
                : (sessionTime || eventTime);
            
            connected = lastSeen ? lastSeen > fiveMinutesAgo : false;
            
            // Xác định method dựa trên properties hoặc device_info
            if (latestSession && latestSession.device_info) {
                method = latestSession.device_info.sdk_version ? 'sdk' : 'plugin';
            } else {
                method = 'sdk'; // Default assumption
            }
        }

        const response = {
            connected,
            lastSeen: lastSeen ? lastSeen.toISOString() : null,
            method,
            details: {
                website_id: websiteId,
                website_name: req.website.name,
                domain: req.website.domain,
                platform_type: req.website.platform_type,
                last_session_activity: latestSession ? latestSession.updated_at : null,
                last_event_activity: latestEvent ? latestEvent.created_at : null
            }
        };

        res.status(200).json({ success: true, data: response });
    })],

    getDashboardStats: [checkWebsiteOwnership, asyncHandler(async (req, res) => {
        const websiteId = req.website.id;

        // Đếm số lượng các tài nguyên và lấy data mappings
        const [pixelCount, eventCount, filterCount, blacklistCount, sessionCount, dataMappingCount, dataMappings] = await Promise.all([
            models.Pixel.count({ where: { website_id: websiteId } }),
            // Đếm events thông qua Session (vì Event không có website_id trực tiếp)
            models.Event.count({
                include: [{
                    model: models.Session,
                    where: { website_id: websiteId },
                    attributes: []
                }]
            }),
            models.EventFilter.count({ where: { website_id: websiteId } }),
            models.Blacklist.count({ where: { website_id: websiteId } }),
            models.Session.count({ where: { website_id: websiteId } }),
            models.DataMapping.count({ where: { website_id: websiteId } }),
            models.DataMapping.findAll({
                where: { website_id: websiteId },
                attributes: ['id', 'variable_name', 'selector', 'page_context', 'created_at'],
                order: [['created_at', 'DESC']]
            })
        ]);

        // Lấy thời gian activity gần nhất và first session
        const [latestEvent, latestSession, firstSession] = await Promise.all([
            models.Event.findOne({
                include: [{
                    model: models.Session,
                    where: { website_id: websiteId },
                    attributes: []
                }],
                order: [['created_at', 'DESC']],
                attributes: ['created_at']
            }),
            models.Session.findOne({
                where: { website_id: websiteId },
                order: [['updated_at', 'DESC']],
                attributes: ['updated_at']
            }),
            models.Session.findOne({
                where: { website_id: websiteId },
                order: [['start_time', 'ASC']],
                attributes: ['start_time']
            })
        ]);

        let lastActivity = null;
        if (latestEvent || latestSession) {
            // Validate and create date objects safely
            let eventTime = null;
            let sessionTime = null;
            
            if (latestEvent && latestEvent.created_at) {
                const tempEventTime = new Date(latestEvent.created_at);
                eventTime = !isNaN(tempEventTime.getTime()) ? tempEventTime : null;
            }
            
            if (latestSession && latestSession.updated_at) {
                const tempSessionTime = new Date(latestSession.updated_at);
                sessionTime = !isNaN(tempSessionTime.getTime()) ? tempSessionTime : null;
            }
            
            lastActivity = eventTime && sessionTime 
                ? (eventTime > sessionTime ? eventTime : sessionTime)
                : (eventTime || sessionTime);
        }

        // Tracking Setup Status
        const trackingSetup = {
            isSetup: sessionCount > 0 || eventCount > 0,
            method: req.website.platform_type === 'wordpress' ? 'plugin' : 'sdk',
            status: (() => {
                if (sessionCount === 0 && eventCount === 0) return 'not_configured';
                if (!lastActivity) return 'inactive';
                
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return lastActivity > twentyFourHoursAgo ? 'active' : 'inactive';
            })(),
            firstSetup: firstSession ? firstSession.start_time : null,
            lastSeen: lastActivity ? lastActivity.toISOString() : null
        };

        // Data Mapping Information
        const dataMapping = {
            total: dataMappingCount,
            configured: dataMappingCount > 0,
            mappings: dataMappings.map(mapping => ({
                id: mapping.id,
                variable_name: mapping.variable_name,
                selector: mapping.selector,
                page_context: mapping.page_context,
                created_at: mapping.created_at
            }))
        };

        const stats = {
            totalPixels: pixelCount,
            totalEvents: eventCount,
            totalFilters: filterCount,
            totalBlacklisted: blacklistCount,
            lastActivity: lastActivity ? lastActivity.toISOString() : null,
            trackingSetup,
            dataMapping
        };

        res.status(200).json({ success: true, data: stats });
    })],
};

module.exports = websiteController;