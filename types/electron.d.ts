export interface ElectronAPI {
  // 基本情報
  platform: string
  versions: NodeJS.ProcessVersions
  
  // WebView関連 (後方互換性のため保持)
  createWebview: (options: { width?: number; height?: number }) => Promise<{ success: boolean; error?: string }>
  navigateWebview: (url: string) => Promise<{ success: boolean; url?: string; error?: string }>
  navigateWebviewBack: () => Promise<{ success: boolean; error?: string }>
  navigateWebviewForward: () => Promise<{ success: boolean; error?: string }>
  reloadWebview: () => Promise<{ success: boolean; error?: string }>
  getWebviewUrl: () => Promise<{ 
    success: boolean; 
    url?: string; 
    title?: string; 
    isLoading?: boolean; 
    canGoBack?: boolean; 
    canGoForward?: boolean; 
    error?: string 
  }>
  closeWebview: () => Promise<{ success: boolean; error?: string }>
  onWebviewLoading: (callback: (isLoading: boolean) => void) => void
  onWebviewNavigation: (callback: (data: { url: string; title: string }) => void) => void
  onWebviewTitle: (callback: (title: string) => void) => void
  onWebviewAudio: (callback: (hasAudio: boolean) => void) => void
  onWebviewError: (callback: (error: { errorCode: number; errorDescription: string; url?: string }) => void) => void
  
  // BrowserView API
  browserView: {
    loadUrl: (url: string) => Promise<{ success: boolean; url?: string; error?: string }>
    getUrl: () => Promise<{ success: boolean; url?: string }>
    goBack: () => Promise<{ success: boolean }>
    goForward: () => Promise<{ success: boolean }>
    reload: () => Promise<{ success: boolean }>
    canGoBack: () => Promise<{ success: boolean; canGoBack: boolean }>
    canGoForward: () => Promise<{ success: boolean; canGoForward: boolean }>
    setBounds: (bounds: { x: number; y: number; width: number; height: number }) => Promise<{ success: boolean }>
    
    // イベントリスナー
    onUrlChanged: (callback: (url: string) => void) => void
    onCanGoBackChanged: (callback: (canGoBack: boolean) => void) => void
    onCanGoForwardChanged: (callback: (canGoForward: boolean) => void) => void
    onLoadingStart: (callback: () => void) => void
    onLoadingStop: (callback: () => void) => void
  }
}

export interface AdvancedTurnstileBypassAPI {
  // 設定
  config: {
    humanBehavior: {
      mouseMoveInterval: number
      mouseMoveProbability: number
      keyPressProbability: number
      scrollProbability: number
      humanDelay: { min: number; max: number }
      mouseTrajectoryComplexity: number
    }
    bypass: {
      hideTurnstileElements: boolean
      simulateHumanBehavior: boolean
      randomizeTiming: boolean
      blockAutomationFlags: boolean
    }
  }

  // 動作統計
  behaviorStats: {
    mouseMovements: number
    keyPresses: number
    scrollEvents: number
    clicks: number
    startTime: number
  }

  // 基本機能
  getUserAgent: () => string
  getHeaders: () => Record<string, string>
  getHumanDelay: () => number

  // 人間らしい動作シミュレーション
  simulateHumanMouseMovement: () => void
  simulateHumanKeyboardInput: () => void
  simulateHumanScroll: () => void
  startHumanBehaviorSimulation: () => void

  // セキュリティ機能
  disableWebRTC: () => void
  disablePlugins: () => void
  disableDownloads: () => void

  // Turnstile検出回避
  bypassTurnstile: () => void
  hideTurnstileElements: () => void
  setupTurnstileObserver: () => void

  // 統計とログ
  logBehaviorStats: () => void

  // 初期化
  initialize: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    turnstileBypass: AdvancedTurnstileBypassAPI
  }
}

// WebViewタグの型定義
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: {
        ref?: React.Ref<any>
        src?: string
        className?: string
        style?: React.CSSProperties
        preload?: string
        allowpopups?: boolean | string
        webpreferences?: string
        useragent?: string
        onDidStartLoading?: () => void
        onDidStopLoading?: () => void
        onDidFinishLoad?: (e: any) => void
        onDidFailLoad?: (e: any) => void
        onPageTitleUpdated?: (e: any) => void
        onMediaStartedPlaying?: () => void
        onMediaPaused?: () => void
      }
    }
  }
}
