"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import path from "path"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Home,
  Settings,
  User,
  Zap,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Star,
  Plus,
  Lock,
  Shield,
  Volume2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Edit,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import UpdateNotification from "@/components/update-notification"

type ActivePanel = "browser" | "settings" | "accounts" | "automation"

type AccountStatus = "active" | "shadowban" | "lock" | "frozen" | "unknown"

interface Tab {
  id: string
  title: string
  url: string
  favicon?: string
  isActive: boolean
  isLoading?: boolean
  hasAudio?: boolean
}

interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string
}

interface Account {
  id: string
  name: string
  username: string
  following: number
  followingChange: number
  followers: number
  followersChange: number
  avatar?: string
  color: string
  status: AccountStatus // ステータスフィールドを追加
}

interface AccountGroup {
  id: string
  name: string
  accounts: Account[]
  isExpanded: boolean
}

export default function DesktopApp() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("browser")
  const [currentUrl, setCurrentUrl] = useState("")
  const [displayUrl, setDisplayUrl] = useState("") // 表示用URL
  const [currentTitle, setCurrentTitle] = useState("")
  const [currentFavicon, setCurrentFavicon] = useState<string>("")
  const [currentIp] = useState("192.168.1.1")
  const [isLoading, setIsLoading] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [hasAudio, setHasAudio] = useState(false)
  const [isElectronReady, setIsElectronReady] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isBookmarked, setIsBookmarked] = useState(false)
  const eventListenersRegisteredRef = useRef(false)
  const lastNavigatedUrlRef = useRef<string>('')

  // クライアントサイドマウント検出
  useEffect(() => {
    setIsMounted(true)
    setCurrentUrl("https://www.google.com")
    setDisplayUrl("https://www.google.com")
  }, [])

  // ブックマークの読み込み
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedBookmarks = localStorage.getItem('bookmarks')
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks))
    }
  }, [])

  // ブックマークの保存
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  // 現在のURLがブックマークされているかチェック
  useEffect(() => {
    const isCurrentBookmarked = bookmarks.some(bookmark => bookmark.url === currentUrl)
    setIsBookmarked(isCurrentBookmarked)
  }, [currentUrl, bookmarks])

  const [draggedTab, setDraggedTab] = useState<string | null>(null)
  const [dragOverTab, setDragOverTab] = useState<string | null>(null)

  const [containerWidth, setContainerWidth] = useState(0)
  const tabContainerRef = useRef<HTMLDivElement>(null)

  const [isAccountPanelCollapsed, setIsAccountPanelCollapsed] = useState(false)

  // ブックマーク機能
  const handleToggleBookmark = () => {
    if (isBookmarked) {
      // ブックマークを削除
      setBookmarks(prev => prev.filter(bookmark => bookmark.url !== currentUrl))
    } else {
      // ブックマークを追加
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        title: currentTitle || new URL(currentUrl).hostname,
        url: currentUrl,
        favicon: currentFavicon || undefined
      }
      setBookmarks(prev => [...prev, newBookmark])
    }
  }

  const handleBookmarkClick = (bookmark: Bookmark) => {
    setCurrentUrl(bookmark.url)
    setDisplayUrl(bookmark.url)
    // currentUrlの変更により、useEffectが自動的にWebViewをナビゲートします
  }

  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId))
  }

  useEffect(() => {
    const updateWidth = () => {
      if (tabContainerRef.current) {
        setContainerWidth(tabContainerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  // Electron IPC通信の設定
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') return

    let retryCount = 0
    const maxRetries = 50 // 5秒間試行

    // Electron APIが利用可能になるまで待機
    const checkElectronAPI = () => {
      if (window.electronAPI) {
        // WebViewタグを使用するため、Electron APIのイベントリスナーは不要
        // 初期化時にWebViewを作成
        window.electronAPI.createWebview({ width: 1200, height: 800 })
        setIsElectronReady(true)
        
        // 初期URLを設定
        if (!currentUrl) {
          setCurrentUrl('https://www.google.com')
          setDisplayUrl('https://www.google.com')
        }
      } else {
        retryCount++
        if (retryCount < maxRetries) {
          // Electron APIがまだ利用できない場合、少し待ってから再試行
          setTimeout(checkElectronAPI, 100)
        } else {
          // Electron APIが利用できない場合でも、WebViewを表示
          setIsElectronReady(true)
          
          // 初期URLを設定
          if (!currentUrl) {
            setCurrentUrl('https://www.google.com')
            setDisplayUrl('https://www.google.com')
          }
        }
      }
    }

    checkElectronAPI()
  }, [])

  // currentUrlが変更されたときにBrowserViewをナビゲート
  useEffect(() => {
    console.log('[DEBUG] currentUrl changed:', currentUrl, 'isMounted:', isMounted, 'isElectronReady:', isElectronReady)
    console.log('[DEBUG] lastNavigatedUrl:', lastNavigatedUrlRef.current)
    
    // about:blankを無視
    if (currentUrl === 'about:blank') {
      console.log('[DEBUG] Skipping navigation - about:blank detected')
      return
    }
    
    if (!currentUrl || !isMounted || !isElectronReady) {
      console.log('[DEBUG] Skipping navigation - conditions not met')
      return
    }
    
    // 同じURLへの重複ナビゲートを防ぐ
    if (currentUrl === lastNavigatedUrlRef.current) {
      console.log('[DEBUG] Skipping navigation - same URL as last navigated')
      return
    }
    
    console.log('[DEBUG] Calling browserView.loadUrl with:', currentUrl)
    lastNavigatedUrlRef.current = currentUrl
    
    // BrowserView APIを使用してURLをロード
    window.electronAPI?.browserView?.loadUrl(currentUrl).then((result: any) => {
      console.log('[DEBUG] loadUrl result:', result)
    }).catch((error: any) => {
      console.error('[DEBUG] Error navigating BrowserView:', error)
    })
  }, [currentUrl, isMounted, isElectronReady])

  // BrowserViewのイベントリスナーを設定（一度だけ）
  useEffect(() => {
    if (!isElectronReady || !isMounted || eventListenersRegisteredRef.current) return
    
    // BrowserViewのイベントリスナーを設定
    if (window.electronAPI?.browserView) {
      eventListenersRegisteredRef.current = true
      
      // URL変更イベント
      window.electronAPI.browserView.onUrlChanged((newUrl: string) => {
        console.log('[DEBUG] onUrlChanged received:', newUrl)
        
        // about:blankを無視
        if (newUrl === 'about:blank' || !newUrl) {
          console.log('[DEBUG] Ignoring about:blank or empty URL')
          return
        }
        
        // 表示用URLのみ更新（ナビゲートはトリガーしない）
        console.log('[DEBUG] Updating display URL only (not triggering navigation)')
        setDisplayUrl(newUrl)
        
        // タブのURLも更新
        setTabs(prev => prev.map(tab => 
          tab.isActive ? { ...tab, url: newUrl } : tab
        ))

        
        // ナビゲーション状態を更新
        window.electronAPI.browserView.canGoBack().then((result: any) => {
          if (result.success) {
            setCanGoBack(result.canGoBack)
          }
        })
        window.electronAPI.browserView.canGoForward().then((result: any) => {
          if (result.success) {
            setCanGoForward(result.canGoForward)
          }
        })
      })
      
      // ローディング開始イベント
      window.electronAPI.browserView.onLoadingStart(() => {
        setIsLoading(true)
      })
      
      // ローディング停止イベント
      window.electronAPI.browserView.onLoadingStop(() => {
        setIsLoading(false)
        
        // ナビゲーション状態を更新
        window.electronAPI.browserView.canGoBack().then((result: any) => {
          if (result.success) {
            setCanGoBack(result.canGoBack)
          }
        })
        window.electronAPI.browserView.canGoForward().then((result: any) => {
          if (result.success) {
            setCanGoForward(result.canGoForward)
          }
        })
      })
      
      // ナビゲーション状態の変更イベント
      window.electronAPI.browserView.onCanGoBackChanged((canGoBack: boolean) => {
        setCanGoBack(canGoBack)
      })
      
      window.electronAPI.browserView.onCanGoForwardChanged((canGoForward: boolean) => {
        setCanGoForward(canGoForward)
      })
    }
  }, [isElectronReady, isMounted])

  // BrowserViewのboundsを更新
  useEffect(() => {
    if (!isElectronReady || !isMounted) return
    
    const updateBrowserViewBounds = () => {
      if (window.electronAPI?.browserView) {
        // ブラウザパネルがアクティブでない時は BrowserView を隠す
        if (activePanel !== 'browser') {
          window.electronAPI.browserView.setBounds({
            x: 0,
            y: 0,
            width: 0,
            height: 0
          }).catch(() => {})
          return
        }
        
        // Webコンテンツエリアの実際のDOMエレメントを取得
        const webContentElement = document.getElementById('web-content-area') as HTMLElement
        
        if (webContentElement) {
          // DOMエレメントの位置とサイズを取得
          const rect = webContentElement.getBoundingClientRect()
          
          window.electronAPI.browserView.setBounds({
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }).catch(() => {})
        } else {
          // フォールバック: 固定値を使用
          const toolbarHeight = 120
          const sidebarWidth = isAccountPanelCollapsed ? 0 : 256
          const windowWidth = window.innerWidth
          const windowHeight = window.innerHeight
          
          window.electronAPI.browserView.setBounds({
            x: sidebarWidth,
            y: toolbarHeight,
            width: windowWidth - sidebarWidth,
            height: windowHeight - toolbarHeight
          }).catch(() => {})
        }
      }
    }
    
    // 初期bounds設定（DOMのレンダリングを待つ）
    setTimeout(() => {
      updateBrowserViewBounds()
    }, 300)
    
    // ウィンドウリサイズ時にboundsを更新
    window.addEventListener('resize', updateBrowserViewBounds)
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', updateBrowserViewBounds)
    }
  }, [isElectronReady, isMounted, isAccountPanelCollapsed, activePanel])


  
  // グローバルエラーハンドラーでWebViewエラーとWebSocketエラーを抑制
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // GUEST_VIEW_MANAGER_CALL、ERR_ABORTED、WebSocketエラーを抑制
      if (event.message && (
        event.message.includes('GUEST_VIEW_MANAGER_CALL') ||
        event.message.includes('ERR_ABORTED (-3)') ||
        event.message.includes('WebSocket connection') ||
        event.message.includes('webpack-hmr')
      )) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // GUEST_VIEW_MANAGER_CALL、ERR_ABORTED、WebSocketエラーを抑制
      if (event.reason && event.reason.message && (
        event.reason.message.includes('GUEST_VIEW_MANAGER_CALL') ||
        event.reason.message.includes('ERR_ABORTED (-3)') ||
        event.reason.message.includes('WebSocket connection') ||
        event.reason.message.includes('webpack-hmr')
      )) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };
    
    // コンソールエラーも抑制
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      const message = args.join(' ');
      if (
        message.includes('WebSocket connection') ||
        message.includes('webpack-hmr') ||
        message.includes('Maximum update depth exceeded')
      ) {
        return; // このエラーを非表示
      }
      originalConsoleError.apply(console, args);
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, [])

  // Vercel Analyticsを無効化（Electron環境では不要）
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Vercel Analyticsスクリプトの読み込みを防ぐ
    const originalCreateElement = document.createElement
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(this, tagName)
      
      if (tagName === 'script' && element instanceof HTMLScriptElement) {
        const originalSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')
        if (originalSrc) {
          Object.defineProperty(element, 'src', {
            get: originalSrc.get,
            set: function(value: string) {
              // Vercel Analyticsスクリプトをブロック
              if (value.includes('va.vercel-scripts.com') || value.includes('vercel-scripts.com')) {
                return
              }
              originalSrc.set?.call(this, value)
            },
            configurable: true
          })
        }
      }
      
      return element
    }
  }, [])

  // React DevToolsの推奨メッセージとWebSocket警告を非表示化
  useEffect(() => {
    if (typeof window === 'undefined') return

    // React DevToolsの推奨メッセージとWebSocket警告を非表示化
    const originalConsoleLog = console.log
    console.log = function(...args: any[]) {
      const message = args.join(' ')
      if (message.includes('Download the React DevTools') || 
          message.includes('reactjs.org/link/react-devtools') ||
          message.includes('WebSocket connection') ||
          message.includes('webpack-hmr')) {
        return // このメッセージを非表示
      }
      originalConsoleLog.apply(console, args)
    }

    // コンソールメッセージをフィルタリング
    const originalConsoleWarn = console.warn
    console.warn = function(...args: any[]) {
      const message = args.join(' ')
      if (message.includes('Download the React DevTools') || 
          message.includes('reactjs.org/link/react-devtools') ||
          message.includes('WebSocket connection') ||
          message.includes('webpack-hmr') ||
          message.includes('Maximum update depth')) {
        return // このメッセージを非表示
      }
      originalConsoleWarn.apply(console, args)
    }

    return () => {
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn
    }
  }, [])

  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([
    {
      id: "work",
      name: "Work Accounts",
      isExpanded: true,
      accounts: [
        {
          id: "w1",
          name: "John Doe",
          username: "johndoe",
          following: 234,
          followingChange: 5,
          followers: 1250,
          followersChange: -3,
          color: "#3b82f6",
          status: "active",
        },
        {
          id: "w2",
          name: "Jane Smith",
          username: "janesmith",
          following: 456,
          followingChange: 12,
          followers: 2340,
          followersChange: 28,
          color: "#8b5cf6",
          status: "shadowban",
        },
      ],
    },
    {
      id: "personal",
      name: "Personal Accounts",
      isExpanded: true,
      accounts: [
        {
          id: "p1",
          name: "Personal Gmail",
          username: "mypersonal",
          following: 123,
          followingChange: 0,
          followers: 567,
          followersChange: 15,
          color: "#10b981",
          status: "active",
        },
        {
          id: "p2",
          name: "Shopping",
          username: "shopaholic",
          following: 89,
          followingChange: -2,
          followers: 234,
          followersChange: 5,
          color: "#f59e0b",
          status: "lock",
        },
      ],
    },
  ])

  const [ungroupedAccounts] = useState<Account[]>([
    {
      id: "u1",
      name: "Test Account",
      username: "testuser",
      following: 45,
      followingChange: 3,
      followers: 78,
      followersChange: -1,
      color: "#ef4444",
      status: "frozen",
    },
    {
      id: "u2",
      name: "Demo User",
      username: "demouser",
      following: 67,
      followingChange: 0,
      followers: 123,
      followersChange: 8,
      color: "#ec4899",
      status: "unknown",
    },
  ])

  const [selectedAccount, setSelectedAccount] = useState<string>("w1")

  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "New Tab", url: "https://www.google.com", isActive: true },
    {
      id: "2",
      title: "GitHub - Where the world builds software",
      url: "https://github.com",
      isActive: false,
      hasAudio: false,
    },
    { id: "3", title: "YouTube", url: "https://youtube.com", isActive: false, hasAudio: true },
  ])


  const sidebarItems = [
    { id: "browser" as const, icon: Home, label: "Browser" },
    { id: "accounts" as const, icon: User, label: "Accounts" },
    { id: "automation" as const, icon: Zap, label: "Automation" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ]

  const handleClose = () => {
    // ウィンドウクローズ処理
  }

  // WebViewタグの参照
  const webviewRef = useRef<any>(null)

  // ナビゲーション機能
  const handleNavigate = async (url: string) => {
    const trimmedUrl = url.trim()
    
    console.log('[DEBUG] handleNavigate called with:', url)
    
    // 空のURLの場合はデフォルトページに
    if (!trimmedUrl) {
      console.log('[DEBUG] Empty URL, navigating to Google')
      setCurrentUrl('https://www.google.com')
      setDisplayUrl('https://www.google.com')
      return
    }
    
    // URLの正規化
    let normalizedUrl = trimmedUrl
    
    // プロトコルがない場合の処理
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('file://')) {
      // 検索クエリかどうかを判定
      if (normalizedUrl.includes(' ') || !normalizedUrl.includes('.')) {
        // 検索クエリの場合、Google検索に変換
        normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(normalizedUrl)}`
        console.log('[DEBUG] Search query detected, normalized to:', normalizedUrl)
      } else {
        // URLの場合、https://を追加
        normalizedUrl = `https://${normalizedUrl}`
        console.log('[DEBUG] URL detected, normalized to:', normalizedUrl)
      }
    }
    
    // URLの妥当性をチェック
    try {
      new URL(normalizedUrl)
      console.log('[DEBUG] URL validation passed:', normalizedUrl)
    } catch (urlError) {
      console.error('[DEBUG] Invalid URL:', normalizedUrl, urlError)
      // 無効なURLの場合はGoogle検索にフォールバック
      normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`
      console.log('[DEBUG] Fallback to search:', normalizedUrl)
    }
    
    // WebView の src プロップと API の二重ナビゲーションを避けるため、
    // ここでは state 更新のみに統一する
    console.log('[DEBUG] Setting currentUrl to:', normalizedUrl)
    setCurrentUrl(normalizedUrl)
    setDisplayUrl(normalizedUrl)
  }

  const handleGoBack = async () => {
    if (canGoBack && window.electronAPI?.browserView) {
      try {
        await window.electronAPI.browserView.goBack()
      } catch (error) {
        console.error('Go back error:', error)
      }
    }
  }

  const handleGoForward = async () => {
    if (canGoForward && window.electronAPI?.browserView) {
      try {
        await window.electronAPI.browserView.goForward()
      } catch (error) {
        console.error('Go forward error:', error)
      }
    }
  }

  const handleReload = async () => {
    if (window.electronAPI?.browserView) {
      try {
        await window.electronAPI.browserView.reload()
      } catch (error) {
        console.error('Reload error:', error)
      }
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const url = displayUrl.trim()
    if (url) {
      handleNavigate(url)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayUrl(e.target.value)
  }

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      url: "https://www.google.com",
      favicon: undefined,
      isActive: true,
    }
    setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: false })).concat(newTab))
    setCurrentUrl("https://www.google.com")
    setDisplayUrl("https://www.google.com")
    setCurrentTitle("New Tab")
    setCurrentFavicon("")
  }

  const setActiveTab = (tabId: string) => {
    setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: tab.id === tabId })))
    const activeTab = tabs.find((tab) => tab.id === tabId)
    if (activeTab) {
      setCurrentUrl(activeTab.url)
      setDisplayUrl(activeTab.url)
      setCurrentTitle(activeTab.title)
      setCurrentFavicon(activeTab.favicon || "")
    }
  }

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault()
    setDragOverTab(tabId)
  }

  const handleDragEnd = () => {
    if (draggedTab && dragOverTab && draggedTab !== dragOverTab) {
      setTabs((prev) => {
        const draggedIndex = prev.findIndex((tab) => tab.id === draggedTab)
        const dragOverIndex = prev.findIndex((tab) => tab.id === dragOverTab)

        const newTabs = [...prev]
        const [removed] = newTabs.splice(draggedIndex, 1)
        newTabs.splice(dragOverIndex, 0, removed)

        return newTabs
      })
    }
    setDraggedTab(null)
    setDragOverTab(null)
  }

  const toggleGroup = (groupId: string) => {
    setAccountGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group)),
    )
  }

  const handleEditAccount = (accountId: string) => {
    // 編集処理をここに実装
  }

  const getStatusStyle = (status: AccountStatus) => {
    switch (status) {
      case "active":
        return "bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/40"
      case "shadowban":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40"
      case "lock":
        return "bg-[var(--color-error)]/20 text-[var(--color-error)] border-[var(--color-error)]/40"
      case "frozen":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40"
      case "unknown":
        return "bg-foreground/10 text-muted-foreground border-foreground/20"
    }
  }

  const getStatusLabel = (status: AccountStatus) => {
    switch (status) {
      case "active":
        return "Active"
      case "shadowban":
        return "Shadowban"
      case "lock":
        return "Locked"
      case "frozen":
        return "Frozen"
      case "unknown":
        return "Unknown"
    }
  }

  const renderMainContent = () => {
    switch (activePanel) {
      case "browser":
        return (
          <div className="flex flex-col h-full">
            <div className="backdrop-blur-xl bg-background/60 border-b border-foreground/5 px-3 py-1.5 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    disabled={!canGoBack}
                    className="h-7 w-7 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoForward}
                    disabled={!canGoForward}
                    className="h-7 w-7 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded-full"
                    onClick={handleReload}
                  >
                    <RotateCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                  </Button>
                </div>

                <div className="flex-1 flex items-center mx-2">
                  <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center backdrop-blur-xl bg-card border border-foreground/10 rounded-full px-3 py-1 focus-within:border-[var(--color-unicorn-blue)]/50 focus-within:shadow-lg focus-within:shadow-[var(--color-unicorn-blue)]/20 transition-all duration-150 hover:bg-card-foreground/5 hover:border-foreground/20">
                    <div className="flex items-center gap-2 mr-2">
                      {currentUrl.startsWith("https://") ? (
                        <Lock className="h-3 w-3 text-[var(--color-success)]" />
                      ) : (
                        <Shield className="h-3 w-3 text-[var(--color-error)]" />
                      )}
                    </div>
                    <Input
                      value={displayUrl}
                      onChange={handleUrlChange}
                      className="bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none p-0 text-sm h-4 flex-1"
                      placeholder="Search Google or type a URL"
                    />
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleBookmark}
                        className={cn(
                          "h-6 w-6 p-0 hover:bg-foreground/10 transition-all duration-150 rounded flex items-center gap-1.5 flex-shrink-0",
                          isBookmarked 
                            ? "text-[var(--color-unicorn-blue)] bg-[var(--color-unicorn-blue)]/10" 
                            : "text-foreground/70 hover:text-[var(--color-unicorn-blue)]"
                        )}
                        title={isBookmarked ? "ブックマークを削除" : "ブックマークに追加"}
                      >
                        <Star className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
                      </Button>
                    </div>
                  </form>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-[var(--color-unicorn-blue)]/20 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded-full bg-[var(--color-unicorn-blue)]/10 border border-[var(--color-unicorn-blue)]/30"
                  title="Current Account"
                >
                  <User className="h-3.5 w-3.5 text-[var(--color-unicorn-blue)]" />
                </Button>
              </div>

              {isLoading && (
                <div className="h-0.5 bg-foreground/5 relative overflow-hidden mt-1.5 rounded-full">
                  <div
                    className="h-full bg-[var(--color-unicorn-blue)] shadow-lg shadow-[var(--color-unicorn-blue)]/50 transition-all duration-300 rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
              )}
            </div>

            <div className="backdrop-blur-xl bg-background/50 border-b border-foreground/5 px-4 py-1.5 shadow-lg">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="group relative flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded flex items-center gap-1.5 flex-shrink-0 text-foreground/70"
                      onClick={() => handleBookmarkClick(bookmark)}
                    >
                      {bookmark.favicon ? (
                        <img 
                          src={bookmark.favicon} 
                          alt="" 
                          className="w-3 h-3 rounded-sm object-cover bg-white/5"
                          onError={(e) => {
                            // faviconの読み込みに失敗した場合、非表示にする
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {!bookmark.favicon && (
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-[var(--color-unicorn-blue)]/50 to-[var(--color-unicorn-blue)]/30 flex items-center justify-center text-foreground text-[8px] font-bold">
                          {bookmark.title[0]}
                        </div>
                      )}
                      <span className="max-w-[120px] truncate">{bookmark.title}</span>
                    </Button>
                    <button
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                      className="opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-all duration-150 rounded flex-shrink-0"
                      title="削除"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div id="web-content-area" className="flex-1 backdrop-blur-sm bg-background/20 relative overflow-hidden" style={{ height: '100%', minHeight: '100%' }}>
              {isMounted ? (
                <div 
                  ref={webviewRef}
                  className="w-full h-full"
                  style={{ height: '100%', minHeight: '100%', backgroundColor: '#ffffff' }}
                >
                  {/* BrowserViewがここに表示されます */}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 text-[var(--color-unicorn-blue)]">🌐</div>
                    <p className="text-lg text-foreground font-medium">ウェブコンテンツエリア</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isLoading ? "読み込み中..." : "BrowserViewを初期化中..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Electron準備完了: {isElectronReady ? "はい" : "いいえ"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      現在のURL: {currentUrl || "なし"}
                    </p>
                    {!currentUrl && (
                      <p className="text-xs text-muted-foreground mt-2">
                        URLが指定されていません
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="p-8 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>
            <div className="space-y-6">
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">Application Settings</h3>
                <p className="text-muted-foreground">Configure your application preferences here.</p>
              </div>
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">Browser Settings</h3>
                <p className="text-muted-foreground">Customize browser behavior and security options.</p>
              </div>
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-4">Application Updates</h3>
                <UpdateNotification />
              </div>
            </div>
          </div>
        )

      case "accounts":
        return (
          <div className="p-8 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-foreground mb-6">Account Management</h2>
            <div className="space-y-4">
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">Social Media Accounts</h3>
                <p className="text-muted-foreground">Manage your connected social media accounts.</p>
              </div>
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">Authentication</h3>
                <p className="text-muted-foreground">Configure login credentials and security settings.</p>
              </div>
            </div>
          </div>
        )

      case "automation":
        return (
          <div className="p-8 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-foreground mb-6">Automation & API Shortcuts</h2>
            <div className="space-y-4">
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">Automation Scripts</h3>
                <p className="text-muted-foreground">Create and manage automation workflows.</p>
              </div>
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">API Shortcuts</h3>
                <p className="text-muted-foreground">Quick access to frequently used API endpoints.</p>
              </div>
            </div>
          </div>
        )
    }
  }

  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((tab) => tab.id !== tabId)
      if (filtered.length === 0) {
        // 最後のタブを閉じた場合、新しいタブを作成
        return [
          {
            id: Date.now().toString(),
            title: "New Tab",
            url: "https://www.google.com",
            isActive: true,
          },
        ]
      }

      // 閉じたタブがアクティブだった場合、隣のタブをアクティブにする
      const closedTab = prev.find((tab) => tab.id === tabId)
      if (closedTab?.isActive && filtered.length > 0) {
        const closedIndex = prev.findIndex((tab) => tab.id === tabId)
        const newActiveIndex = Math.min(closedIndex, filtered.length - 1)
        filtered[newActiveIndex].isActive = true
      }

      return filtered
    })
  }

  const calculateTabWidth = () => {
    const maxWidth = 240
    const minWidth = 72
    const buttonWidth = 40 // +ボタンの幅
    const availableWidth = containerWidth - buttonWidth

    if (availableWidth <= 0 || tabs.length === 0) return maxWidth

    const calculatedWidth = availableWidth / tabs.length

    if (calculatedWidth > maxWidth) return maxWidth
    if (calculatedWidth < minWidth) return minWidth
    return calculatedWidth
  }

  const tabWidth = calculateTabWidth()
  const showTabTitle = tabWidth > 72

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-muted/40 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-muted/40 rounded-full mix-blend-screen filter blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[var(--color-unicorn-blue)]/10 rounded-full mix-blend-screen filter blur-3xl animate-pulse animation-delay-4000"></div>
          <div className="absolute bottom-0 right-20 w-72 h-72 bg-muted/40 rounded-full mix-blend-screen filter blur-3xl animate-pulse animation-delay-1000"></div>
        </div>
      </div>

      <div className="relative z-10 backdrop-blur-xl bg-background/95 border-b border-[var(--color-unicorn-blue)]/20 shadow-2xl">
        <div className="flex items-center">
          <div className="w-16 flex-shrink-0 flex items-center justify-center">
            <span className="text-white font-bold text-base tracking-tight">TwiX</span>
          </div>

          <AnimatePresence>
            {!isAccountPanelCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full px-4 py-2 border-x border-[var(--color-unicorn-blue)]/20 flex items-center justify-between overflow-hidden"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground leading-tight">Accounts</h3>
                  <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">Manage your profiles</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAccountPanelCollapsed(true)}
                  className="h-7 w-7 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 flex-shrink-0 ml-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={tabContainerRef} className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {tabs.map((tab) => (
                <motion.div
                  key={tab.id}
                  layout
                  initial={{ width: 0, opacity: 0, scale: 0.8 }}
                  animate={{
                    width: tabWidth,
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.2, ease: "easeOut" },
                  }}
                  exit={{
                    width: 0,
                    opacity: 0,
                    scale: 0.8,
                    transition: { duration: 0.15, ease: "easeIn" },
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, tab.id)}
                  onDragOver={(e) => handleDragOver(e as any, tab.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2 cursor-pointer",
                    "transition-colors duration-200 ease-out flex-shrink-0",
                    tab.isActive
                      ? "bg-foreground/10 text-foreground shadow-lg border-t-2 border-[var(--color-unicorn-blue)] shadow-[var(--color-unicorn-blue)]/20"
                      : "bg-background/30 hover:bg-foreground/5 text-foreground/60 hover:text-foreground/90 border-t-2 border-transparent",
                    draggedTab === tab.id && "opacity-50",
                    dragOverTab === tab.id && "border-l-2 border-[var(--color-unicorn-blue)]",
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ width: tabWidth }}
                >
                  <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                    {tab.isLoading ? (
                      <div className="w-3 h-3 border-2 border-[var(--color-unicorn-blue)] border-t-transparent rounded-full animate-spin" />
                    ) : tab.favicon ? (
                      <img 
                        src={tab.favicon} 
                        alt="" 
                        className="w-4 h-4 rounded-sm object-cover bg-white/5"
                        onError={(e) => {
                          // faviconの読み込みに失敗した場合、非表示にする
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-[#4285f4] to-[#34a853] flex items-center justify-center text-foreground text-xs font-bold">
                        🌐
                      </div>
                    )}
                  </div>

                  {showTabTitle && <span className="truncate text-sm font-normal flex-1 min-w-0">{tab.title}</span>}

                  {tab.hasAudio && showTabTitle && (
                    <Volume2 className="h-3 w-3 text-[var(--color-unicorn-blue)] flex-shrink-0" />
                  )}

                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className={cn(
                      "flex-shrink-0 h-4 w-4 rounded-sm hover:bg-foreground/20 flex items-center justify-center transition-all duration-150 cursor-pointer",
                      showTabTitle ? "opacity-0 group-hover:opacity-100" : "opacity-100",
                    )}
                  >
                    <X className="h-3 w-3" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="sm"
              onClick={addNewTab}
              className="h-8 w-8 p-0 ml-1 hover:bg-foreground/10 hover:text-foreground transition-all duration-200 rounded flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* サイドバー（左側） */}
        <div className="w-16 backdrop-blur-xl bg-background/80 border-r border-[var(--color-unicorn-blue)]/20 flex flex-col items-center py-4 gap-4 shadow-xl">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activePanel === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(item.id)}
                className={cn(
                  "h-10 w-10 p-0 rounded-xl transition-all duration-300 relative group",
                  isActive
                    ? "bg-gradient-to-br from-[var(--color-purple-glow)]/20 to-[var(--color-pink-glow)]/20 text-foreground shadow-lg shadow-[var(--color-purple-glow)]/60 border border-[var(--color-purple-glow)]/40"
                    : "hover:bg-foreground/5 text-foreground/60 hover:text-foreground border border-transparent hover:border-[var(--color-purple-glow)]/20",
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-purple-glow)]/40 to-[var(--color-pink-glow)]/40 rounded-xl blur-xl animate-pulse"></div>
                )}
                <Icon
                  className={cn("h-5 w-5 relative z-10", isActive && "drop-shadow-[0_0_10px_var(--color-purple-glow)]")}
                />
              </Button>
            )
          })}
          <div className="flex-1"></div>
          <div className="text-[10px] text-muted-foreground font-mono">v.1.1</div>
        </div>

        {/* アカウントパネル（サイドバーの右側） */}
        <motion.div
          animate={{ width: isAccountPanelCollapsed ? 0 : 256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="backdrop-blur-xl bg-background/80 border-r border-[var(--color-unicorn-blue)]/20 flex flex-col shadow-xl overflow-hidden"
        >
          {!isAccountPanelCollapsed && (
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent">
              <div className="p-2 space-y-2">
                {accountGroups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-foreground/5 rounded transition-colors"
                    >
                      {group.isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-foreground/60" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
                      )}
                      <span className="text-xs font-medium text-foreground/80">{group.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{group.accounts.length}</span>
                    </button>

                    {group.isExpanded && (
                      <div className="ml-4 space-y-1">
                        {group.accounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setSelectedAccount(account.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200",
                              selectedAccount === account.id
                                ? "bg-gradient-to-br from-[var(--color-purple-glow)]/20 to-[var(--color-pink-glow)]/20 border border-[var(--color-purple-glow)]/40 shadow-lg"
                                : "hover:bg-foreground/5 border border-transparent",
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: account.color }}
                            >
                              {account.name[0]}
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-xs font-medium text-foreground truncate">@{account.username}</p>
                                <span
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0",
                                    getStatusStyle(account.status),
                                  )}
                                >
                                  {getStatusLabel(account.status)}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {account.following}
                                {account.followingChange !== 0 && (
                                  <span
                                    className={
                                      account.followingChange > 0
                                        ? "text-[var(--color-success)]"
                                        : "text-[var(--color-error)]"
                                    }
                                  >
                                    {account.followingChange > 0
                                      ? ` (+${account.followingChange})`
                                      : ` (${account.followingChange})`}
                                  </span>
                                )}
                                {" / "}
                                {account.followers}
                                {account.followersChange !== 0 && (
                                  <span
                                    className={
                                      account.followersChange > 0
                                        ? "text-[var(--color-success)]"
                                        : "text-[var(--color-error)]"
                                    }
                                  >
                                    {account.followersChange > 0
                                      ? ` (+${account.followersChange})`
                                      : ` (${account.followersChange})`}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditAccount(account.id)
                              }}
                              className="h-6 w-6 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 flex-shrink-0 flex items-center justify-center cursor-pointer rounded"
                            >
                              <Edit className="h-3 w-3" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {ungroupedAccounts.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-foreground/10">
                    <div className="px-2 py-1.5">
                      <span className="text-xs font-medium text-foreground/80">Other Accounts</span>
                    </div>
                    <div className="space-y-1">
                      {ungroupedAccounts.map((account) => (
                        <button
                          key={account.id}
                          onClick={() => setSelectedAccount(account.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200",
                            selectedAccount === account.id
                              ? "bg-gradient-to-br from-[var(--color-purple-glow)]/20 to-[var(--color-pink-glow)]/20 border border-[var(--color-purple-glow)]/40 shadow-lg"
                              : "hover:bg-foreground/5 border border-transparent",
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: account.color }}
                          >
                            {account.name[0]}
                          </div>
                          <div className="flex-1 text-left overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-medium text-foreground truncate">@{account.username}</p>
                              <span
                                className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0",
                                  getStatusStyle(account.status),
                                )}
                              >
                                {getStatusLabel(account.status)}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {account.following}
                              {account.followingChange !== 0 && (
                                <span
                                  className={
                                    account.followingChange > 0
                                      ? "text-[var(--color-success)]"
                                      : "text-[var(--color-error)]"
                                  }
                                >
                                  {account.followingChange > 0
                                    ? ` (+${account.followingChange})`
                                    : ` (${account.followingChange})`}
                                </span>
                              )}
                              {" / "}
                              {account.followers}
                              {account.followersChange !== 0 && (
                                <span
                                  className={
                                    account.followersChange > 0
                                      ? "text-[var(--color-success)]"
                                      : "text-[var(--color-error)]"
                                  }
                                >
                                  {account.followersChange > 0
                                    ? ` (+${account.followersChange})`
                                    : ` (${account.followersChange})`}
                                </span>
                              )}
                            </p>
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditAccount(account.id)
                            }}
                            className="h-6 w-6 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 flex-shrink-0 flex items-center justify-center cursor-pointer rounded"
                          >
                            <Edit className="h-3 w-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isAccountPanelCollapsed && (
            <div className="p-2 border-t border-foreground/10">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Add Account</span>
              </Button>
            </div>
          )}
        </motion.div>

        {isAccountPanelCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="absolute top-1/2 -translate-y-1/2 left-20 z-20"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAccountPanelCollapsed(false)}
              className="h-8 w-8 p-0 backdrop-blur-xl bg-background/80 border border-[var(--color-unicorn-blue)]/20 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] hover:border-[var(--color-unicorn-blue)]/40 transition-all duration-150 shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* メインコンテンツエリア（中央） */}
        <div id="main-content-area" className="flex-1 backdrop-blur-sm bg-background/60 flex flex-col overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </div>
  )
}
