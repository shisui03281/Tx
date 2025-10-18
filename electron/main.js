const { app, BrowserWindow, BrowserView, Menu, ipcMain, dialog, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// 開発環境ではセキュリティ警告を抑制
if (isDev) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

// Cloudflare Turnstileをbypassするための設定
const TURNSTILE_BYPASS_CONFIG = {
    // ユーザーエージェントを最新のChromeに偽装
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',

    // 必要なヘッダーを設定
    extraHeaders: [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language: ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding: gzip, deflate, br, zstd',
        'DNT: 1',
        'Connection: keep-alive',
        'Upgrade-Insecure-Requests: 1',
        'Sec-Fetch-Dest: document',
        'Sec-Fetch-Mode: navigate',
        'Sec-Fetch-Site: none',
        'Sec-Fetch-User: ?1',
        'Sec-Ch-Ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile: ?0',
        'Sec-Ch-Ua-Platform: "Windows"',
        'Cache-Control: max-age=0'
    ].join('\n'),

    // WebRTC IP漏洩を防ぐ
    webRTC: false,

    // プラグインを無効化
    plugins: false,

    // 自動ダウンロードを無効化
    downloads: false
};

// WebViewのセキュリティ制限を緩和するコマンドライン引数
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('allow-running-insecure-content');
app.commandLine.appendSwitch('ignore-certificate-errors');

// Turnstile bypass用の追加コマンドライン引数
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests');
app.commandLine.appendSwitch('enable-features', 'NetworkService,NetworkServiceInProcess');
app.commandLine.appendSwitch('disable-infobars');
app.commandLine.appendSwitch('disable-session-crashed-bubble');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('hide-scrollbars');
app.commandLine.appendSwitch('mute-audio');


// メインウィンドウとBrowserViewの参照を保持
let mainWindow;
let browserView;
let currentUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../out/index.html')}`;
let browserViewUrl = 'https://www.google.com';

// BrowserViewを作成・管理する関数
function createBrowserView() {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    // 既存のBrowserViewがあれば削除
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed()) {
        // イベントリスナーを削除
        browserView.webContents.removeAllListeners();
        mainWindow.removeBrowserView(browserView);
        browserView.webContents.destroy();
    }

    // 新しいBrowserViewを作成
    browserView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
            experimentalFeatures: true,
            partition: 'persist:browserview'
        }
    });

    // MaxListenersを増やしてメモリリーク警告を回避
    browserView.webContents.setMaxListeners(20);

    // BrowserViewをウィンドウに追加
    mainWindow.addBrowserView(browserView);

    // BrowserViewのサイズを設定（ツールバーとサイドバー分を考慮）
    const updateBrowserViewBounds = () => {
        if (!mainWindow || mainWindow.isDestroyed() || !browserView || !browserView.webContents || browserView.webContents.isDestroyed()) return;
        const bounds = mainWindow.getContentBounds();
        const toolbarHeight = 120; // ツールバーの高さ（Reactで設定した値と同じ）
        const sidebarWidth = 256; // サイドバーの幅（デフォルト値）
        browserView.setBounds({
            x: sidebarWidth,
            y: toolbarHeight,
            width: bounds.width - sidebarWidth,
            height: bounds.height - toolbarHeight
        });
    };

    updateBrowserViewBounds();

    // ウィンドウサイズ変更時にBrowserViewのサイズも更新
    mainWindow.on('resize', updateBrowserViewBounds);
    mainWindow.on('maximize', updateBrowserViewBounds);
    mainWindow.on('unmaximize', updateBrowserViewBounds);

    // BrowserViewのセッション設定を適用
    const browserViewSession = browserView.webContents.session;
    browserViewSession.setUserAgent(TURNSTILE_BYPASS_CONFIG.userAgent);

    // ヘッダーを設定
    browserViewSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const headers = { ...details.requestHeaders };

        headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
        headers['Accept-Language'] = 'ja,en-US;q=0.9,en;q=0.8';
        headers['Accept-Encoding'] = 'gzip, deflate, br, zstd';
        headers['DNT'] = '1';
        headers['Connection'] = 'keep-alive';
        headers['Upgrade-Insecure-Requests'] = '1';
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = 'none';
        headers['Sec-Fetch-User'] = '?1';
        headers['Cache-Control'] = 'max-age=0';

        // Sec-Ch-Uaヘッダーを正しく設定（削除しない）
        headers['Sec-Ch-Ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
        headers['Sec-Ch-Ua-Mobile'] = '?0';
        headers['Sec-Ch-Ua-Platform'] = '"Windows"';

        // 開発ツールの痕跡を削除
        delete headers['X-DevTools-Emulate-Network-Conditions-Client-Id'];
        delete headers['X-DevTools-Request-Id'];

        callback({ requestHeaders: headers });
    });

    // Cloudflareの検出
    browserViewSession.webRequest.onHeadersReceived((details, callback) => {
        callback({ responseHeaders: details.responseHeaders });
    });

    // 強化されたAnti-detection スクリプトを注入
    browserView.webContents.on('dom-ready', () => {
        browserView.webContents.executeJavaScript(`
            (function() {
                try {
                    // navigator.webdriverを完全に削除
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                        configurable: true
                    });
                    
                    // window.chromeオブジェクトを追加
                    if (!window.chrome) {
                        window.chrome = {
                            runtime: {},
                            loadTimes: function() {},
                            csi: function() {},
                            app: {}
                        };
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
                    
                    // プラグインを偽装（実際のブラウザのように）
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => {
                            return [
                                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                                { name: 'Native Client', filename: 'internal-nacl-plugin' }
                            ];
                        },
                        configurable: true
                    });
                    
                    // 言語設定を偽装
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['ja', 'en-US', 'en'],
                        configurable: true
                    });
                    
                    // hardwareConcurrencyを偽装
                    Object.defineProperty(navigator, 'hardwareConcurrency', {
                        get: () => 8,
                        configurable: true
                    });
                    
                    // deviceMemoryを偽装
                    Object.defineProperty(navigator, 'deviceMemory', {
                        get: () => 8,
                        configurable: true
                    });
                    
                    // maxTouchPointsを偽装
                    Object.defineProperty(navigator, 'maxTouchPoints', {
                        get: () => 0,
                        configurable: true
                    });
                    
                    // platformを確実に設定
                    Object.defineProperty(navigator, 'platform', {
                        get: () => 'Win32',
                        configurable: true
                    });
                    
                    // vendorを設定
                    Object.defineProperty(navigator, 'vendor', {
                        get: () => 'Google Inc.',
                        configurable: true
                    });
                    
                    // Notification.permissionを偽装
                    try {
                        Object.defineProperty(Notification, 'permission', {
                            get: () => 'default',
                            configurable: true
                        });
                    } catch(e) {}
                    
                    // Battery APIを無効化
                    if (navigator.getBattery) {
                        navigator.getBattery = undefined;
                    }
                    
                    // WebGL Vendorを偽装
                    const getParameter = WebGLRenderingContext.prototype.getParameter;
                    WebGLRenderingContext.prototype.getParameter = function(parameter) {
                        if (parameter === 37445) {
                            return 'Intel Inc.';
                        }
                        if (parameter === 37446) {
                            return 'Intel Iris OpenGL Engine';
                        }
                        return getParameter.call(this, parameter);
                    };
                    
                } catch (e) {
                    // エラーを無視
                }
            })();
        `).catch(() => {
            // エラーを無視
        });
    });

    // ナビゲーションイベント
    browserView.webContents.on('did-start-navigation', (event, url) => {
        browserViewUrl = url;
        // レンダラープロセスにURLの変更を通知
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('browserview-url-changed', url);
        }
    });

    browserView.webContents.on('did-navigate', (event, url) => {
        browserViewUrl = url;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('browserview-url-changed', url);
            mainWindow.webContents.send('browserview-can-go-back', browserView.webContents.canGoBack());
            mainWindow.webContents.send('browserview-can-go-forward', browserView.webContents.canGoForward());
        }
    });

    browserView.webContents.on('did-navigate-in-page', (event, url) => {
        browserViewUrl = url;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('browserview-url-changed', url);
        }
    });

    // ローディング状態の通知
    browserView.webContents.on('did-start-loading', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('browserview-loading-start');
        }
    });

    browserView.webContents.on('did-stop-loading', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('browserview-loading-stop');
        }
    });

    // 初期URLをロード
    browserView.webContents.loadURL(browserViewUrl);
}

// Turnstile bypass用のセッション設定
function setupSession() {
    // デフォルトセッションに設定を適用
    const ses = session.defaultSession;

    // ユーザーエージェントを設定
    ses.setUserAgent(TURNSTILE_BYPASS_CONFIG.userAgent);

    // ヘッダーを設定
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        // 既存のヘッダーを保持
        const headers = { ...details.requestHeaders };

        // 重要なヘッダーを追加/上書き
        headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';
        headers['Accept-Language'] = 'ja,en-US;q=0.9,en;q=0.8';
        headers['Accept-Encoding'] = 'gzip, deflate, br';
        headers['DNT'] = '1';
        headers['Connection'] = 'keep-alive';
        headers['Upgrade-Insecure-Requests'] = '1';
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = 'none';
        headers['Sec-Fetch-User'] = '?1';
        headers['Cache-Control'] = 'max-age=0';

        // 自動化フラグを削除（bot検出を回避）
        delete headers['Sec-Ch-Ua'];
        delete headers['Sec-Ch-Ua-Mobile'];
        delete headers['Sec-Ch-Ua-Platform'];
        delete headers['Sec-Ch-Ua-Full-Version'];
        delete headers['Sec-Ch-Ua-Full-Version-List'];

        // Electronのデフォルトヘッダーを削除
        delete headers['X-DevTools-Emulate-Network-Conditions-Client-Id'];

        callback({ requestHeaders: headers });
    });

    // レスポンスヘッダーを監視
    ses.webRequest.onHeadersReceived((details, callback) => {
        callback({ responseHeaders: details.responseHeaders });
    });

    // WebRTC IP漏洩を防ぐ
    ses.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            callback(false);
        } else {
            callback(true);
        }
    });
}

function createWindow() {
    // メインウィンドウを作成
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webviewTag: true,
            sandbox: false, // webviewTagを使用するためにはsandboxをfalseに設定
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../public/placeholder-logo.png'),
        show: false, // 準備ができてから表示
        titleBarStyle: 'default'
    });

    // MaxListenersを増やしてメモリリーク警告を回避
    mainWindow.webContents.setMaxListeners(20);

    // Content Security Policyを設定
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        // 開発環境では緩いCSPを使用し、本番環境では厳格なCSPを使用
        const csp = isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http: ws: wss: *; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: *; " +
            "style-src 'self' 'unsafe-inline' https: http: *; " +
            "img-src 'self' data: blob: https: http: *; " +
            "connect-src 'self' https: http: ws: wss: *; " +
            "font-src 'self' data: https: http: *; " +
            "media-src 'self' https: http: blob: data: *; " +
            "frame-src 'self' https: http: *; " +
            "child-src 'self' https: http: *;"
            : "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "connect-src 'self' https:; " +
            "font-src 'self' data:; " +
            "media-src 'self' https: data:; " +
            "frame-src 'self' https:; " +
            "child-src 'self' https:;";

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp]
            }
        });
    });

    // 現在のURLを読み込み
    mainWindow.loadURL(currentUrl);

    // WebViewの設定
    mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
        // スクリプトの実行を許可しないプリロードスクリプトを削除
        delete webPreferences.preload;

        // セキュリティ設定（webSecurityをfalseに変更してサイトの読み込みを許可）
        webPreferences.nodeIntegration = false;
        webPreferences.contextIsolation = true;
        webPreferences.sandbox = false; // sandboxをfalseに変更
        webPreferences.webSecurity = false; // webSecurityをfalseに変更してCORSエラーを回避
        webPreferences.allowRunningInsecureContent = true; // 安全でないコンテンツも許可

        // 追加のセキュリティ回避設定
        webPreferences.experimentalFeatures = true;
        webPreferences.enableBlinkFeatures = 'OverlayScrollbars';
        webPreferences.disablewebsecurity = true; // WebSecurityを完全に無効化

        // ナビゲーション制限を解除
        webPreferences.navigateOnDragDrop = true;
    });


    // ウィンドウが準備できたら表示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // 開発環境ではDevToolsを開く
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }

        // BrowserViewを作成（ウィンドウが表示された後）
        setTimeout(() => {
            createBrowserView();
        }, 100);
    });

    // メインウィンドウにも強化されたAnti-detectionスクリプトを注入
    mainWindow.webContents.on('dom-ready', () => {
        mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    // navigator.webdriverを完全に削除
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                        configurable: true
                    });
                    
                    // window.chromeオブジェクトを追加
                    if (!window.chrome) {
                        window.chrome = {
                            runtime: {},
                            loadTimes: function() {},
                            csi: function() {},
                            app: {}
                        };
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
                    
                    // プラグインを偽装（実際のブラウザのように）
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => {
                            return [
                                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                                { name: 'Native Client', filename: 'internal-nacl-plugin' }
                            ];
                        },
                        configurable: true
                    });
                    
                    // 言語設定を偽装
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['ja', 'en-US', 'en'],
                        configurable: true
                    });
                    
                    // hardwareConcurrencyを偽装
                    Object.defineProperty(navigator, 'hardwareConcurrency', {
                        get: () => 8,
                        configurable: true
                    });
                    
                    // deviceMemoryを偽装
                    Object.defineProperty(navigator, 'deviceMemory', {
                        get: () => 8,
                        configurable: true
                    });
                    
                    // maxTouchPointsを偽装
                    Object.defineProperty(navigator, 'maxTouchPoints', {
                        get: () => 0,
                        configurable: true
                    });
                    
                    // platformを確実に設定
                    Object.defineProperty(navigator, 'platform', {
                        get: () => 'Win32',
                        configurable: true
                    });
                    
                    // vendorを設定
                    Object.defineProperty(navigator, 'vendor', {
                        get: () => 'Google Inc.',
                        configurable: true
                    });
                    
                    // Notification.permissionを偽装
                    try {
                        Object.defineProperty(Notification, 'permission', {
                            get: () => 'default',
                            configurable: true
                        });
                    } catch(e) {}
                    
                    // Battery APIを無効化
                    if (navigator.getBattery) {
                        navigator.getBattery = undefined;
                    }
                    
                    // WebGL Vendorを偽装
                    const getParameter = WebGLRenderingContext.prototype.getParameter;
                    WebGLRenderingContext.prototype.getParameter = function(parameter) {
                        if (parameter === 37445) {
                            return 'Intel Inc.';
                        }
                        if (parameter === 37446) {
                            return 'Intel Iris OpenGL Engine';
                        }
                        return getParameter.call(this, parameter);
                    };
                    
                } catch (e) {
                    // エラーを無視
                }
            })();
        `).catch(() => {
            // エラーを無視
        });
    });

    // ウィンドウが閉じられた時の処理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 外部リンクをデフォルトブラウザで開く
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

// アプリケーションの準備ができたらウィンドウを作成
app.whenReady().then(() => {
    // Turnstile bypass用のセッション設定を適用
    setupSession();

    createWindow();

    // macOSでは、アプリがアクティブになった時にウィンドウを再作成
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
    // macOS以外では、すべてのウィンドウが閉じられたらアプリを終了
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// セキュリティ: 新しいウィンドウの作成を制限とWebView設定
app.on('web-contents-created', (event, contents) => {
    // WebViewのセキュリティ設定
    if (contents.getType() === 'webview') {
        // MaxListenersを増やしてメモリリーク警告を回避
        contents.setMaxListeners(20);

        // WebView用のセッション設定を適用
        const webviewSession = contents.session;

        // ユーザーエージェントを設定
        webviewSession.setUserAgent(TURNSTILE_BYPASS_CONFIG.userAgent);

        // ヘッダーを設定
        webviewSession.webRequest.onBeforeSendHeaders((details, callback) => {
            const headers = { ...details.requestHeaders };

            // 重要なヘッダーを追加/上書き
            headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
            headers['Accept-Language'] = 'ja,en-US;q=0.9,en;q=0.8';
            headers['Accept-Encoding'] = 'gzip, deflate, br, zstd';
            headers['DNT'] = '1';
            headers['Connection'] = 'keep-alive';
            headers['Upgrade-Insecure-Requests'] = '1';
            headers['Sec-Fetch-Dest'] = 'document';
            headers['Sec-Fetch-Mode'] = 'navigate';
            headers['Sec-Fetch-Site'] = 'none';
            headers['Sec-Fetch-User'] = '?1';
            headers['Cache-Control'] = 'max-age=0';

            // Sec-Ch-Uaヘッダーを正しく設定（削除しない）
            headers['Sec-Ch-Ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
            headers['Sec-Ch-Ua-Mobile'] = '?0';
            headers['Sec-Ch-Ua-Platform'] = '"Windows"';

            // 開発ツールの痕跡を削除
            delete headers['X-DevTools-Emulate-Network-Conditions-Client-Id'];
            delete headers['X-DevTools-Request-Id'];

            callback({ requestHeaders: headers });
        });

        // Cloudflareの検出
        webviewSession.webRequest.onHeadersReceived((details, callback) => {
            callback({ responseHeaders: details.responseHeaders });
        });

        // 強化されたAnti-detection スクリプトを注入（WebView用）
        contents.on('dom-ready', () => {
            contents.executeJavaScript(`
                (function() {
                    try {
                        // navigator.webdriverを完全に削除
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined,
                            configurable: true
                        });
                        
                        // window.chromeオブジェクトを追加
                        if (!window.chrome) {
                            window.chrome = {
                                runtime: {},
                                loadTimes: function() {},
                                csi: function() {},
                                app: {}
                            };
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
                        
                        // プラグインを偽装（実際のブラウザのように）
                        Object.defineProperty(navigator, 'plugins', {
                            get: () => {
                                return [
                                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                                    { name: 'Native Client', filename: 'internal-nacl-plugin' }
                                ];
                            },
                            configurable: true
                        });
                        
                        // 言語設定を偽装
                        Object.defineProperty(navigator, 'languages', {
                            get: () => ['ja', 'en-US', 'en'],
                            configurable: true
                        });
                        
                        // hardwareConcurrencyを偽装
                        Object.defineProperty(navigator, 'hardwareConcurrency', {
                            get: () => 8,
                            configurable: true
                        });
                        
                        // deviceMemoryを偽装
                        Object.defineProperty(navigator, 'deviceMemory', {
                            get: () => 8,
                            configurable: true
                        });
                        
                        // maxTouchPointsを偽装
                        Object.defineProperty(navigator, 'maxTouchPoints', {
                            get: () => 0,
                            configurable: true
                        });
                        
                        // platformを確実に設定
                        Object.defineProperty(navigator, 'platform', {
                            get: () => 'Win32',
                            configurable: true
                        });
                        
                        // vendorを設定
                        Object.defineProperty(navigator, 'vendor', {
                            get: () => 'Google Inc.',
                            configurable: true
                        });
                        
                        // Notification.permissionを偽装
                        try {
                            Object.defineProperty(Notification, 'permission', {
                                get: () => 'default',
                                configurable: true
                            });
                        } catch(e) {}
                        
                        // Battery APIを無効化
                        if (navigator.getBattery) {
                            navigator.getBattery = undefined;
                        }
                        
                        // WebGL Vendorを偽装
                        const getParameter = WebGLRenderingContext.prototype.getParameter;
                        WebGLRenderingContext.prototype.getParameter = function(parameter) {
                            if (parameter === 37445) {
                                return 'Intel Inc.';
                            }
                            if (parameter === 37446) {
                                return 'Intel Iris OpenGL Engine';
                            }
                            return getParameter.call(this, parameter);
                        };
                        
                    } catch (e) {
                        // エラーを無視
                    }
                })();
            `).catch(() => {
                // エラーを無視
            });
        });

        // WebViewのナビゲーション制御
        contents.on('will-navigate', (event, navigationUrl) => {
            // すべてのナビゲーションを許可（イベントをキャンセルしない）
        });

        // より積極的なナビゲーション許可
        contents.on('will-redirect', (event, url) => {
            // すべてのリダイレクトを許可
        });

        // WebViewのエラーハンドリング
        contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            // -3 (ERR_ABORTED) は通常のナビゲーションキャンセルなので無視
            // -102 (ERR_CONNECTION_REFUSED) などの実際のエラーのみログに記録
            if (errorCode !== -3 && errorCode !== 0) {
                console.error('WebView failed to load:', {
                    errorCode,
                    errorDescription,
                    validatedURL
                });
            }
        });

        // コンソールメッセージをフィルタリング
        contents.on('console-message', (event, level, message, line, sourceId) => {
            // ERR_ABORTED エラーや GUEST_VIEW_MANAGER_CALL エラーを無視
            const ignoredMessages = [
                'ERR_ABORTED (-3)',
                'GUEST_VIEW_MANAGER_CALL',
                'Unexpected error while loading URL',
                'Error invoking remote method'
            ];

            if (ignoredMessages.some(ignored => message.includes(ignored))) {
                return; // このメッセージをログに記録しない
            }

            // エラーのみログに記録（警告は無視）
            if (level === 3) { // error
                console.error(`WebView [${sourceId}:${line}]:`, message);
            }
        });
    }

    // 新しいウィンドウのハンドリング
    contents.setWindowOpenHandler(({ url }) => {
        // 外部URLはデフォルトブラウザで開く
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
});

// URL変更機能
function changeUrl(newUrl) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        currentUrl = newUrl;
        mainWindow.loadURL(newUrl);
    }
}

// IPC ハンドラー
ipcMain.handle('change-url', async (event, url) => {
    changeUrl(url);
    return { success: true };
});

ipcMain.handle('get-current-url', async () => {
    return currentUrl;
});

ipcMain.handle('show-url-dialog', async () => {
    const result = await dialog.showInputBox({
        title: 'URLを入力',
        message: '新しいURLを入力してください:',
        defaultInput: currentUrl,
        properties: ['openFile', 'openDirectory']
    });

    if (result.response === 0 && result.data) {
        changeUrl(result.data);
    }

    return result;
});

// BrowserView用のIPCハンドラー
ipcMain.handle('browserview-load-url', async (event, url) => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed()) {
        browserView.webContents.loadURL(url);
        browserViewUrl = url;
        return { success: true, url };
    }
    return { success: false, error: 'BrowserView not available' };
});

ipcMain.handle('browserview-get-url', async () => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed()) {
        return { success: true, url: browserView.webContents.getURL() };
    }
    return { success: false, url: browserViewUrl };
});

ipcMain.handle('browserview-go-back', async () => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed() && browserView.webContents.canGoBack()) {
        browserView.webContents.goBack();
        return { success: true };
    }
    return { success: false };
});

ipcMain.handle('browserview-go-forward', async () => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed() && browserView.webContents.canGoForward()) {
        browserView.webContents.goForward();
        return { success: true };
    }
    return { success: false };
});

ipcMain.handle('browserview-reload', async () => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed()) {
        browserView.webContents.reload();
        return { success: true };
    }
    return { success: false };
});

ipcMain.handle('browserview-can-go-back', async () => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed()) {
        return { success: true, canGoBack: browserView.webContents.canGoBack() };
    }
    return { success: false, canGoBack: false };
});

ipcMain.handle('browserview-can-go-forward', async () => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed()) {
        return { success: true, canGoForward: browserView.webContents.canGoForward() };
    }
    return { success: false, canGoForward: false };
});

ipcMain.handle('browserview-set-bounds', async (event, bounds) => {
    if (browserView && browserView.webContents && !browserView.webContents.isDestroyed()) {
        browserView.setBounds(bounds);
        return { success: true };
    }
    return { success: false };
});

// メニュー設定
const template = [
    {
        label: 'Navigation',
        submenu: [
            {
                label: 'Change URL...',
                accelerator: 'CmdOrCtrl+Shift+U',
                click: async () => {
                    const result = await dialog.showInputBox({
                        title: 'URLを入力',
                        message: '新しいURLを入力してください:',
                        defaultInput: currentUrl
                    });

                    if (result.response === 0 && result.data) {
                        changeUrl(result.data);
                    }
                }
            },
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: () => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.reload();
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Go to Google',
                click: () => changeUrl('https://www.google.com')
            },
            {
                label: 'Go to X.com',
                click: () => changeUrl('https://x.com')
            },
            {
                label: 'Go to X.com Login',
                click: () => changeUrl('https://x.com/login')
            },
            {
                label: 'Go to X.com Account Access',
                click: () => changeUrl('https://x.com/account/access')
            },
            {
                label: 'Go to Localhost',
                click: () => changeUrl('http://localhost:3000')
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
