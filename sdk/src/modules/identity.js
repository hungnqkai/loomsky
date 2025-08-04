/*
File: sdk/src/modules/identity.js (CẬP NHẬT)
- Hoàn thiện logic để đọc/ghi userId và sessionId từ cookie và localStorage.
*/
import CookieManager from '../utils/cookies';

class Identity {
    constructor() {
        this.userId = null;
        this.sessionId = null;
        this.init();
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    init() {
        this.userId = this.getOrCreateId('ls_user_id', 365); // Lưu user_id trong 1 năm
        this.sessionId = this.getOrCreateId('ls_session_id', 0.02); // Lưu session_id trong ~30 phút
    }

    getOrCreateId(key, expirationDays) {
        let id = CookieManager.get(key) || localStorage.getItem(key);
        
        if (!id) {
            id = this.generateUUID();
        }

        // Luôn cập nhật lại để gia hạn thời gian sống
        CookieManager.set(key, id, expirationDays);
        localStorage.setItem(key, id);
        
        return id;
    }
}

export default Identity;