const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'TwiX Browser',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
      // セキュリティ設定を追加
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    frame: true,
    titleBarStyle: 'default',
  });

  // webviewのエラーハンドリング
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // ERR_ABORTEDエラーは通常、ナビゲーションが中断されたことを示すため、無視
    if (errorCode !== -3) {
      console.error('Failed to load:', validatedURL, errorCode, errorDescription);
    }
  });

  // DevToolsのコンソールエラーを抑制（開発環境のみ）
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      // 無害なDevToolsエラーを抑制
      if (message.includes('Unknown VE context') || 
          message.includes('Autofill.enable') ||
          message.includes('Autofill.setAddresses')) {
        return; // これらのエラーは無視
      }
    });
  }

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Try port 3000 first, then 3001 if 3000 is unavailable
    const tryPorts = ['3000', '3001'];
    let portIndex = 0;
    
    const tryLoad = () => {
      const port = tryPorts[portIndex];
      const url = `http://localhost:${port}`;
      
      // Use Node's http module to check if server is available
      const http = require('http');
      const req = http.get(url, (res) => {
        mainWindow.loadURL(url);
        // DevToolsを開くが、エラーを抑制
        mainWindow.webContents.openDevTools();
      });
      
      req.on('error', () => {
        portIndex++;
        if (portIndex < tryPorts.length) {
          setTimeout(tryLoad, 500);
        } else {
          // Fallback to port 3000
          mainWindow.loadURL('http://localhost:3000');
          mainWindow.webContents.openDevTools();
        }
      });
    };
    
    tryLoad();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

