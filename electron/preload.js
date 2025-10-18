const { contextBridge, ipcRenderer } = require('electron');

// Anti-detection: navigator.webdriverを削除
if (navigator.webdriver) {
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
    });
}

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
    // URL変更機能（メインウィンドウ用）
    changeUrl: (url) => ipcRenderer.invoke('change-url', url),
    getCurrentUrl: () => ipcRenderer.invoke('get-current-url'),
    showUrlDialog: () => ipcRenderer.invoke('show-url-dialog'),

    // BrowserView制御API
    browserView: {
        loadUrl: (url) => ipcRenderer.invoke('browserview-load-url', url),
        getUrl: () => ipcRenderer.invoke('browserview-get-url'),
        goBack: () => ipcRenderer.invoke('browserview-go-back'),
        goForward: () => ipcRenderer.invoke('browserview-go-forward'),
        reload: () => ipcRenderer.invoke('browserview-reload'),
        canGoBack: () => ipcRenderer.invoke('browserview-can-go-back'),
        canGoForward: () => ipcRenderer.invoke('browserview-can-go-forward'),
        setBounds: (bounds) => ipcRenderer.invoke('browserview-set-bounds', bounds),

        // イベントリスナー
        onUrlChanged: (callback) => {
            ipcRenderer.on('browserview-url-changed', (event, url) => callback(url));
        },
        onCanGoBackChanged: (callback) => {
            ipcRenderer.on('browserview-can-go-back', (event, canGoBack) => callback(canGoBack));
        },
        onCanGoForwardChanged: (callback) => {
            ipcRenderer.on('browserview-can-go-forward', (event, canGoForward) => callback(canGoForward));
        },
        onLoadingStart: (callback) => {
            ipcRenderer.on('browserview-loading-start', () => callback());
        },
        onLoadingStop: (callback) => {
            ipcRenderer.on('browserview-loading-stop', () => callback());
        }
    },

    // WebView作成（後方互換性のためのダミー関数）
    createWebview: (options) => {
        return Promise.resolve({ success: true });
    },

    // アプリ情報
    platform: process.platform,
    version: process.versions.electron,

    // イベントリスナー（メインウィンドウ用）
    onUrlChanged: (callback) => {
        ipcRenderer.on('url-changed', (event, url) => callback(url));
    }
});

// chrome.runtimeを追加（正規のChromeブラウザのように見せる）
if (!window.chrome) {
    window.chrome = {};
}
if (!window.chrome.runtime) {
    window.chrome.runtime = {};
}

// Permissions APIを偽装
const originalQuery = window.navigator.permissions?.query;
if (originalQuery) {
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );
}

// プラグインを実在っぽいオブジェクトで偽装
Object.defineProperty(navigator, 'plugins', {
    get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
    ],
    configurable: true
});

// 言語設定を偽装
Object.defineProperty(navigator, 'languages', {
    get: () => ['ja', 'en-US', 'en'],
    configurable: true
});

// navigator.webdriver を常に undefined に偽装
try {
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
    });
} catch (e) { }

// window.chrome を補完
if (!window.chrome) {
    window.chrome = {};
}
if (!window.chrome.runtime) {
    window.chrome.runtime = {};
}

