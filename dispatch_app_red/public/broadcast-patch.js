/**
 * Zhaogui AI Broadcast - Elite Patch v2.0
 * 進化版補丁：解決語音穩定性、UI 同步與動態視覺回饋。
 */

(function() {
    console.log("%c[EliteBroadcast] 正在套用進化補丁...", "color: #f3c14b; font-weight: bold;");

    // 1. 強化語音引擎
    if (window.speechSynthesis) {
        // 防止手機瀏覽器回收語音引擎
        setInterval(() => {
            if (speechSynthesis.speaking) {
                speechSynthesis.pause();
                speechSynthesis.resume();
            }
        }, 10000);
    }

    // 2. 擴充渲染邏輯：加入動態視覺
    const originalRenderSegments = window.renderSegments;
    if (typeof originalRenderSegments === 'function') {
        window.renderSegments = function() {
            originalRenderSegments();
            // 在新版 UI 中，我們需要確保列表高度正確
            const list = document.getElementById('teleprompter-list');
            if (list) {
                const active = list.querySelector('.teleprompter-line.active');
                if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        };
    }

    // 3. 修正播報按鈕樣式
    const updateButtons = () => {
        const btnStart = document.getElementById('btn-start-broadcast');
        if (btnStart) {
            btnStart.classList.add('btn-play');
            btnStart.innerHTML = '▶ 開始播報';
        }
    };

    // 初始執行
    setTimeout(updateButtons, 500);
})();
