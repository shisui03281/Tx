const { app, BrowserWindow, session, webContents } = require('electron');
const path = require('path');

// Cloudflare Turnstileをbypassするための設定
const TURNSTILE_BYPASS_CONFIG = {
    // ユーザーエージェントを本物のブラウザに偽装
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

    // 必要なヘッダーを設定
    extraHeaders: [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language: en-US,en;q=0.9',
        'Accept-Encoding: gzip, deflate, br',
        'DNT: 1',
        'Connection: keep-alive',
        'Upgrade-Insecure-Requests: 1',
        'Sec-Fetch-Dest: document',
        'Sec-Fetch-Mode: navigate',
        'Sec-Fetch-Site: none',
        'Sec-Fetch-User: ?1',
        'Cache-Control: max-age=0'
    ].join('\n'),

    // WebRTC IP漏洩を防ぐ
    webRTC: false,

    // プラグインを無効化
    plugins: false,

    // 自動ダウンロードを無効化
    downloads: false
};

let mainWindow;

function createWindow() {
    // メインウィンドウを作成
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            // セキュリティを強化しつつ、必要な機能を有効化
            experimentalFeatures: false,
            // プリロードスクリプトでTurnstile bypass機能を注入
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    // ウィンドウが準備できたら表示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // セッション設定を適用
    setupSession();

    // ターゲットサイトを読み込み
    mainWindow.loadURL('https://x.com/account/access?lang=ja');

    // レンダラースクリプトを注入
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
      const script = document.createElement('script');
      script.src = 'file://${path.join(__dirname, 'renderer.js')}';
      document.head.appendChild(script);
    `);
    });

    // 開発者ツールを開く（デバッグ用）
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // ウィンドウが閉じられたときの処理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

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
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        headers['Accept-Encoding'] = 'gzip, deflate, br';
        headers['DNT'] = '1';
        headers['Connection'] = 'keep-alive';
        headers['Upgrade-Insecure-Requests'] = '1';
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = 'none';
        headers['Sec-Fetch-User'] = '?1';
        headers['Cache-Control'] = 'max-age=0';

        // 自動化フラグを削除
        if (headers['Sec-Ch-Ua']) {
            delete headers['Sec-Ch-Ua'];
        }
        if (headers['Sec-Ch-Ua-Mobile']) {
            delete headers['Sec-Ch-Ua-Mobile'];
        }
        if (headers['Sec-Ch-Ua-Platform']) {
            delete headers['Sec-Ch-Ua-Platform'];
        }

        callback({ requestHeaders: headers });
    });

    // レスポンスヘッダーを監視
    ses.webRequest.onHeadersReceived((details, callback) => {
        // Cloudflareのチャレンジページを検出
        if (details.responseHeaders['cf-ray'] || details.responseHeaders['cf-cache-status']) {
            console.log('Cloudflare detected:', details.url);
        }

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

// アプリの準備ができたときの処理
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// セキュリティ警告を無効化（開発用）
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
