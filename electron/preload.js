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
    },

    // 自動更新API
    updater: {
        checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
        downloadUpdate: () => ipcRenderer.invoke('download-update'),
        installUpdate: () => ipcRenderer.invoke('install-update'),
        getAppVersion: () => ipcRenderer.invoke('get-app-version'),

        // 更新イベントリスナー
        onUpdateChecking: (callback) => {
            ipcRenderer.on('update-checking', () => callback());
        },
        onUpdateAvailable: (callback) => {
            ipcRenderer.on('update-available', (event, info) => callback(info));
        },
        onUpdateNotAvailable: (callback) => {
            ipcRenderer.on('update-not-available', (event, info) => callback(info));
        },
        onUpdateError: (callback) => {
            ipcRenderer.on('update-error', (event, error) => callback(error));
        },
        onUpdateDownloadProgress: (callback) => {
            ipcRenderer.on('update-download-progress', (event, progress) => callback(progress));
        },
        onUpdateDownloaded: (callback) => {
            ipcRenderer.on('update-downloaded', (event, info) => callback(info));
        }
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

// プラグインの長さを偽装
Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5],
    configurable: true
});

// 言語設定を偽装
Object.defineProperty(navigator, 'languages', {
    get: () => ['ja', 'en-US', 'en'],
    configurable: true
});

