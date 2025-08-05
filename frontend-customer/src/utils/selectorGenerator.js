/**
 * Tạo ra một CSS selector đủ tin cậy cho một phần tử DOM.
 * Thuật toán này ưu tiên ID, sau đó đến các class đặc trưng, và cuối cùng là cấu trúc DOM.
 * @param {HTMLElement} el - Phần tử DOM cần tạo selector.
 * @returns {string} - Một chuỗi CSS selector.
 */
export function generateCssSelector(el) {
    if (!(el instanceof Element)) {
        return '';
    }

    const path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break; // ID là duy nhất, không cần đi lên cao hơn
        } else {
            let sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector) {
                    nth++;
                }
            }
            if (nth != 1) {
                selector += `:nth-of-type(${nth})`;
            }
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(' > ');
}
