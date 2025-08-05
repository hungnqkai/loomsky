/**
 * (MỚI) Module này chịu trách nhiệm thu thập dữ liệu từ trang
 * dựa trên các ánh xạ (DataMappings) do người dùng định nghĩa.
 */
class DataCollector {
    /**
     * @param {Array<object>} mappings - Mảng các đối tượng DataMapping từ API config.
     */
    constructor(mappings = []) {
        this.mappings = mappings;
        this.collectedData = {};
    }

    /**
     * Trích xuất nội dung từ một phần tử DOM.
     * Ưu tiên value (cho input), sau đó đến innerText.
     * @param {HTMLElement} element - Phần tử DOM.
     * @returns {string|null}
     * @private
     */
    _extractValue(element) {
        if (!element) return null;
        // Ưu tiên cho các thẻ input, textarea, select
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
            return element.value;
        }
        // Lấy text content, loại bỏ các khoảng trắng thừa
        return element.innerText ? element.innerText.trim() : null;
    }

    /**
     * Quét toàn bộ trang và thu thập tất cả dữ liệu dựa trên các ánh xạ đã cung cấp.
     * @returns {object} - Một đối tượng chứa dữ liệu đã thu thập.
     */
    collectAll() {
        if (!this.mappings || this.mappings.length === 0) {
            return {};
        }

        console.log('LoomSky SDK: Collecting data based on mappings...');
        this.collectedData = {};

        this.mappings.forEach(mapping => {
            try {
                const element = document.querySelector(mapping.selector);
                if (element) {
                    const value = this._extractValue(element);
                    if (value) {
                        this.collectedData[mapping.variable_name] = value;
                    }
                }
            } catch (error) {
                console.warn(`LoomSky SDK: Invalid selector "${mapping.selector}" for variable "${mapping.variable_name}".`, error);
            }
        });

        console.log('LoomSky SDK: Data collected.', this.collectedData);
        return this.collectedData;
    }
}

export default DataCollector;
