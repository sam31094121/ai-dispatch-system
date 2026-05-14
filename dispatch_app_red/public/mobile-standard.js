/**
 * Zhaogui AI Dispatch - Mobile Standard Engine
 * 統一全系統手機專用版邏輯核心。
 */

class MobileStandardEngine {
    constructor() {
        this.init();
    }

    init() {
        console.log("%c[MobileEngine] 啟動手機專用核心...", "color: #f3c14b; font-weight: bold;");
        this.enforceTouchOptimizations();
        this.setupWakeLock();
        this.lockOrientation();
        this.handleSystemMeta();
    }

    /**
     * 強制觸控優化：防止縮放、處理延遲
     */
    enforceTouchOptimizations() {
        // 暫時解除攔截，確保原生捲動順暢
        /*
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault(); // 禁止多指縮放
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) e.preventDefault(); // 禁止雙擊縮放
            lastTouchEnd = now;
        }, false);
        */
    }

    /**
     * 嘗試鎖定螢幕不進入休眠 (需使用者互動)
     */
    async setupWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                document.addEventListener('click', async () => {
                    const wakeLock = await navigator.wakeLock.request('screen');
                    console.log('[MobileEngine] 螢幕常亮已啟動');
                }, { once: true });
            } catch (err) {
                console.error('[MobileEngine] WakeLock 失敗:', err);
            }
        }
    }

    /**
     * 鎖定直向 (部分瀏覽器支援)
     */
    lockOrientation() {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(err => {
                console.log('[MobileEngine] 轉向鎖定不受支援或被拒絕');
            });
        }
    }

    /**
     * 設定手機版專用 Meta 標籤 (如果遺漏)
     */
    handleSystemMeta() {
        const metas = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'format-detection', content: 'telephone=no' }
        ];

        metas.forEach(m => {
            if (!document.querySelector(`meta[name="${m.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = m.name;
                meta.content = m.content;
                document.head.appendChild(meta);
            }
        });
    }
}

// 自動初始化
window.MobileEngine = new MobileStandardEngine();
