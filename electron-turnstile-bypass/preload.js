const { contextBridge, ipcRenderer } = require('electron');

// セキュアなコンテキストブリッジを設定
contextBridge.exposeInMainWorld('electronAPI', {
    // 必要に応じてメインプロセスとの通信用APIをここに追加
    platform: process.platform,
    versions: process.versions
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

