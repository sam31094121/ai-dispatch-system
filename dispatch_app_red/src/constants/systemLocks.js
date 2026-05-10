/**
 * Zhaogui AI Dispatch - 系統硬鎖定規則 (System Hard-Lock)
 * 核心企劃：確保 5月9號總結算與歷史關鍵業績「全部都不動」，禁止任何自動修正。
 */

const LOCKED_DATES = [
    '2026/05/09', // 5月9號總決算：禁止變動
    '115/05/09'   // 民國格式支援
];

const IMMUTABLE_REPORTS = [
    'dispatch_2026_05_09_v1'
];

/**
 * 檢查日期是否處於硬鎖定狀態
 * @param {string} dateString 
 * @returns {boolean}
 */
function isDateLocked(dateString) {
    if (!dateString) return false;
    const normalized = String(dateString).trim().replace(/-/g, '/');
    return LOCKED_DATES.some(locked => normalized.includes(locked));
}

/**
 * 檢查檔案名稱是否屬於保護報告
 * @param {string} fileName 
 * @returns {boolean}
 */
function isReportLocked(fileName) {
    return IMMUTABLE_REPORTS.some(locked => fileName.includes(locked));
}

module.exports = {
    LOCKED_DATES,
    IMMUTABLE_REPORTS,
    isDateLocked,
    isReportLocked
};
