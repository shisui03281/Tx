const { contextBridge, ipcRenderer } = require('electron');

// セキュアなコンテキストブリッジを設定
contextBridge.exposeInMainWorld('electronAPI', {
    // 基本情報
    platform: process.platform,
    versions: process.versions,

    // BrowserView API（エラーハンドリング付き）
    browserView: {
        loadUrl: (url) => {
            try {
                return ipcRenderer.invoke('browser-view-load-url', url);
            } catch (error) {
                console.error('BrowserView loadUrl error:', error);
                return Promise.resolve({ success: false, error: error.message });
            }
        },
        getUrl: () => {
            try {
                return ipcRenderer.invoke('browser-view-get-url');
            } catch (error) {
                console.error('BrowserView getUrl error:', error);
                return Promise.resolve({ success: false, error: error.message });
            }
        },
        goBack: () => {
            try {
                return ipcRenderer.invoke('browser-view-go-back');
            } catch (error) {
                console.error('BrowserView goBack error:', error);
                return Promise.resolve({ success: false, error: error.message });
            }
        },
        goForward: () => {
            try {
                return ipcRenderer.invoke('browser-view-go-forward');
            } catch (error) {
                console.error('BrowserView goForward error:', error);
                return Promise.resolve({ success: false, error: error.message });
            }
        },
        reload: () => {
            try {
                return ipcRenderer.invoke('browser-view-reload');
            } catch (error) {
                console.error('BrowserView reload error:', error);
                return Promise.resolve({ success: false, error: error.message });
            }
        },
        canGoBack: () => {
            try {
                return ipcRenderer.invoke('browser-view-can-go-back');
            } catch (error) {
                console.error('BrowserView canGoBack error:', error);
                return Promise.resolve({ success: false, canGoBack: false, error: error.message });
            }
        },
        canGoForward: () => {
            try {
                return ipcRenderer.invoke('browser-view-can-go-forward');
            } catch (error) {
                console.error('BrowserView canGoForward error:', error);
                return Promise.resolve({ success: false, canGoForward: false, error: error.message });
            }
        },
        setBounds: (bounds) => {
            try {
                return ipcRenderer.invoke('browser-view-set-bounds', bounds);
            } catch (error) {
                console.error('BrowserView setBounds error:', error);
                return Promise.resolve({ success: false, error: error.message });
            }
        },

        // イベントリスナー（エラーハンドリング付き）
        onUrlChanged: (callback) => {
            try {
                ipcRenderer.on('browser-view-url-changed', (event, url) => {
                    if (typeof callback === 'function') {
                        callback(url);
                    }
                });
            } catch (error) {
                console.error('BrowserView onUrlChanged error:', error);
            }
        },
        onCanGoBackChanged: (callback) => {
            try {
                ipcRenderer.on('browser-view-can-go-back-changed', (event, canGoBack) => {
                    if (typeof callback === 'function') {
                        callback(canGoBack);
                    }
                });
            } catch (error) {
                console.error('BrowserView onCanGoBackChanged error:', error);
            }
        },
        onCanGoForwardChanged: (callback) => {
            try {
                ipcRenderer.on('browser-view-can-go-forward-changed', (event, canGoForward) => {
                    if (typeof callback === 'function') {
                        callback(canGoForward);
                    }
                });
            } catch (error) {
                console.error('BrowserView onCanGoForwardChanged error:', error);
            }
        },
        onLoadingStart: (callback) => {
            try {
                ipcRenderer.on('browser-view-loading-start', () => {
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            } catch (error) {
                console.error('BrowserView onLoadingStart error:', error);
            }
        },
        onLoadingStop: (callback) => {
            try {
                ipcRenderer.on('browser-view-loading-stop', () => {
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            } catch (error) {
                console.error('BrowserView onLoadingStop error:', error);
            }
        }
    }
});

// ページロード時のスクリプト注入
window.addEventListener('DOMContentLoaded', () => {
    console.log('Turnstile Bypass - Preload script loaded');

    // ページのメタ情報をログ出力
    console.log('User Agent:', navigator.userAgent);
    console.log('WebDriver:', navigator.webdriver);
    console.log('Languages:', navigator.languages);
    console.log('Platform:', navigator.platform);
});

// 自動化検出を回避するためのパッチ
Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
});

// Chromeの自動化フラグを隠蔽
if (window.navigator.plugins) {
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
    });
}

// 言語設定を自然に見せる
Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en', 'ja'],
});

console.log('Turnstile Bypass - Patches applied');

