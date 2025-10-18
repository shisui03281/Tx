// レンダラープロセス用のTurnstile Bypassスクリプト

(function () {
    'use strict';

    console.log('Turnstile Bypass - Renderer script loaded');

    // Cloudflare Turnstileの検出と処理
    function detectTurnstile() {
        // Turnstileのiframeを検出
        const turnstileIframe = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
        if (turnstileIframe) {
            console.log('Turnstile challenge detected!');
            return true;
        }

        // Turnstileのウィジェットを検出
        const turnstileWidget = document.querySelector('[data-sitekey]');
        if (turnstileWidget) {
            console.log('Turnstile widget detected!');
            return true;
        }

        return false;
    }

    // ページの状態を監視
    function monitorPage() {
        console.log('Monitoring page for Turnstile challenges...');

        // 定期的にチェック
        setInterval(() => {
            const hasTurnstile = detectTurnstile();

            if (hasTurnstile) {
                console.log('Turnstile is present on the page');
                // 必要に応じて追加の処理をここに実装
            }
        }, 2000);

        // DOMの変更を監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    detectTurnstile();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ページのロード完了を待つ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', monitorPage);
    } else {
        monitorPage();
    }

    // Canvas Fingerprintingを妨害
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const context = originalGetContext.apply(this, [type, ...args]);

        if (type === '2d' || type === 'webgl' || type === 'webgl2') {
            // ランダムノイズを追加してfingerprintを変更
            const originalGetImageData = context.getImageData;
            context.getImageData = function (...args) {
                const imageData = originalGetImageData.apply(this, args);
                // 微小なノイズを追加
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] = imageData.data[i] + Math.random() * 0.1;
                }
                return imageData;
            };
        }

        return context;
    };

    // AudioContext Fingerprintingを妨害
    if (typeof AudioContext !== 'undefined') {
        const OriginalAudioContext = AudioContext;
        window.AudioContext = function (...args) {
            const audioContext = new OriginalAudioContext(...args);

            const originalCreateOscillator = audioContext.createOscillator;
            audioContext.createOscillator = function () {
                const oscillator = originalCreateOscillator.apply(this, arguments);
                // 周波数に微小な変更を加える
                const originalStart = oscillator.start;
                oscillator.start = function (...args) {
                    oscillator.frequency.value += Math.random() * 0.0001;
                    return originalStart.apply(this, args);
                };
                return oscillator;
            };

            return audioContext;
        };
    }

    // WebGL Fingerprintingを妨害
    if (typeof WebGLRenderingContext !== 'undefined') {
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
            // 一般的なGPU情報を返す代わりに標準的な値を返す
            if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
                return 'Intel Inc.';
            }
            if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
                return 'Intel Iris OpenGL Engine';
            }
            return originalGetParameter.apply(this, [parameter]);
        };
    }

    // Screen解像度のノイズ追加
    Object.defineProperties(window.screen, {
        width: {
            get: () => 1920 + Math.floor(Math.random() * 10)
        },
        height: {
            get: () => 1080 + Math.floor(Math.random() * 10)
        },
        availWidth: {
            get: () => 1920 + Math.floor(Math.random() * 10)
        },
        availHeight: {
            get: () => 1040 + Math.floor(Math.random() * 10)
        }
    });

    console.log('Turnstile Bypass - All patches applied successfully');

})();

