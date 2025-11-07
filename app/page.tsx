"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  FolderPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com")
  const [urlInput, setUrlInput] = useState("https://www.google.com")
  const [currentIp] = useState("192.168.1.1")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const [draggedTab, setDraggedTab] = useState<string | null>(null)
  const [dragOverTab, setDragOverTab] = useState<string | null>(null)

  const [containerWidth, setContainerWidth] = useState(0)
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const webviewRef = useRef<any>(null)

  const [isAccountPanelCollapsed, setIsAccountPanelCollapsed] = useState(false)

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newAccount, setNewAccount] = useState({
    name: "",
    username: "",
    groupId: "",
    status: "active" as AccountStatus,
    color: "#3b82f6",
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  // WebViewのURLを更新
  useEffect(() => {
    if (webviewRef.current && currentUrl) {
      const webview = webviewRef.current as any
      if (webview && webview.loadURL) {
        try {
          // URLが有効な形式かチェック
          if (currentUrl.startsWith('http://') || currentUrl.startsWith('https://')) {
            webview.loadURL(currentUrl)
          } else if (currentUrl.includes('.')) {
            // ドメインのみの場合はhttps://を追加
            webview.loadURL(`https://${currentUrl}`)
          }
        } catch (error) {
          console.error('Failed to load URL:', error)
        }
      }
    }
  }, [currentUrl])

  // currentUrlが変更されたときにurlInputも更新（タブ切り替え時など）
  useEffect(() => {
    setUrlInput(currentUrl)
  }, [currentUrl])

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

  const [bookmarks] = useState<Bookmark[]>([
    { id: "1", title: "GitHub", url: "https://github.com" },
    { id: "2", title: "YouTube", url: "https://youtube.com" },
    { id: "3", title: "Twitter", url: "https://twitter.com" },
    { id: "4", title: "Reddit", url: "https://reddit.com" },
    { id: "5", title: "Stack Overflow", url: "https://stackoverflow.com" },
  ])

  const sidebarItems = [
    { id: "browser" as const, icon: Home, label: "Browser" },
    { id: "accounts" as const, icon: User, label: "Accounts" },
    { id: "automation" as const, icon: Zap, label: "Automation" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ]

  const handleClose = () => {
    console.log("[v0] Close window")
  }

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      url: "https://www.google.com",
      isActive: true,
    }
    setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: false })).concat(newTab))
  }

  const setActiveTab = (tabId: string) => {
    setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: tab.id === tabId })))
    const activeTab = tabs.find((tab) => tab.id === tabId)
    if (activeTab) {
      setCurrentUrl(activeTab.url)
      setUrlInput(activeTab.url)
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
    console.log("[v0] Edit account:", accountId)
    // 編集処理をここに実装
  }

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: AccountGroup = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        accounts: [],
        isExpanded: true,
      }
      setAccountGroups((prev) => [...prev, newGroup])
      setNewGroupName("")
      setIsAddingGroup(false)
    }
  }

  const handleAddAccount = () => {
    if (newAccount.name.trim() && newAccount.username.trim() && newAccount.groupId) {
      const account: Account = {
        id: Date.now().toString(),
        name: newAccount.name.trim(),
        username: newAccount.username.trim(),
        following: 0,
        followingChange: 0,
        followers: 0,
        followersChange: 0,
        color: newAccount.color,
        status: newAccount.status,
      }

      setAccountGroups((prev) =>
        prev.map((group) =>
          group.id === newAccount.groupId ? { ...group, accounts: [...group.accounts, account] } : group,
        ),
      )

      setNewAccount({
        name: "",
        username: "",
        groupId: "",
        status: "active",
        color: "#3b82f6",
      })
      setIsAddAccountModalOpen(false)
    }
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
                    className="h-7 w-7 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded-full"
                    onClick={() => {
                      if (webviewRef.current) {
                        const webview = webviewRef.current as any
                        if (webview && webview.goBack) {
                          webview.goBack()
                        }
                      }
                    }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded-full"
                    onClick={() => {
                      if (webviewRef.current) {
                        const webview = webviewRef.current as any
                        if (webview && webview.goForward) {
                          webview.goForward()
                        }
                      }
                    }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded-full"
                    onClick={() => {
                      if (webviewRef.current) {
                        const webview = webviewRef.current as any
                        if (webview && webview.reload) {
                          setIsLoading(true)
                          webview.reload()
                        }
                      } else {
                        setIsLoading(true)
                        setTimeout(() => setIsLoading(false), 2000)
                      }
                    }}
                  >
                    <RotateCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                  </Button>
                </div>

                <div className="flex-1 flex items-center mx-2">
                  <div className="flex-1 flex items-center backdrop-blur-xl bg-card border border-foreground/10 rounded-full px-3 py-1 focus-within:border-[var(--color-unicorn-blue)]/50 focus-within:shadow-lg focus-within:shadow-[var(--color-unicorn-blue)]/20 transition-all duration-150 hover:bg-card-foreground/5 hover:border-foreground/20">
                    <div className="flex items-center gap-2 mr-2">
                      {urlInput.startsWith("https://") ? (
                        <Lock className="h-3 w-3 text-[var(--color-success)]" />
                      ) : urlInput.startsWith("http://") ? (
                        <Shield className="h-3 w-3 text-[var(--color-error)]" />
                      ) : (
                        <Shield className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const url = e.currentTarget.value.trim()
                          let finalUrl = url
                          // URL形式を正規化
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            if (url.includes('.')) {
                              finalUrl = `https://${url}`
                            } else {
                              // 検索クエリとして扱う
                              finalUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`
                            }
                          }
                          setCurrentUrl(finalUrl)
                          setUrlInput(finalUrl)
                        }
                      }}
                      onBlur={() => {
                        // フォーカスが外れたとき、入力値が空の場合は現在のURLに戻す
                        if (!urlInput.trim()) {
                          setUrlInput(currentUrl)
                        }
                      }}
                      className="bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none p-0 text-sm h-4"
                      placeholder="Search Google or type a URL"
                    />
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded flex items-center gap-1.5 flex-shrink-0 text-foreground/70 hover:text-foreground"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
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
                  <Button
                    key={bookmark.id}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 rounded flex items-center gap-1.5 flex-shrink-0 text-foreground/70 hover:text-foreground"
                    onClick={() => {
                      setCurrentUrl(bookmark.url)
                      setUrlInput(bookmark.url)
                    }}
                  >
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-[var(--color-unicorn-blue)]/50 to-[var(--color-unicorn-blue)]/30 flex items-center justify-center text-foreground text-[8px] font-bold">
                      {bookmark.title[0]}
                    </div>
                    <span className="max-w-[120px] truncate">{bookmark.title}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1 backdrop-blur-sm bg-background/20 relative overflow-hidden">
              {isMounted && typeof window !== 'undefined' && (window as any).electron ? (
                <webview
                  ref={webviewRef}
                  src={currentUrl}
                  className="w-full h-full"
                  style={{ display: 'flex' }}
                  allowpopups="true"
                  webpreferences="contextIsolation=yes,nodeIntegration=no"
                  suppressHydrationWarning
                  onDidStartLoading={() => {
                    setIsLoading(true)
                  }}
                  onDidStopLoading={() => {
                    setIsLoading(false)
                    if (webviewRef.current) {
                      const webview = webviewRef.current as any
                      if (webview && webview.getURL) {
                        const url = webview.getURL()
                        if (url && url !== currentUrl) {
                          setCurrentUrl(url)
                          setUrlInput(url)
                        }
                        if (webview.getTitle) {
                          const title = webview.getTitle()
                          if (title) {
                            const activeTab = tabs.find(tab => tab.isActive)
                            if (activeTab) {
                              setTabs(prev => prev.map(tab => 
                                tab.id === activeTab.id ? { ...tab, title } : tab
                              ))
                            }
                          }
                        }
                      }
                    }
                  }}
                  onDidFailLoad={(e: any) => {
                    setIsLoading(false)
                    // ERR_ABORTEDエラーは通常、ナビゲーションが中断されたことを示すため、無視
                    if (e.errorCode !== -3) {
                      console.error('Failed to load:', e)
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 text-[var(--color-unicorn-blue)]">🌐</div>
                    <p className="text-lg text-foreground font-medium">Web Content Area</p>
                    <p className="text-sm text-muted-foreground mt-2">Browser content will be displayed here</p>
                    <p className="text-xs text-muted-foreground mt-4">Electron環境で実行してください</p>
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
            <div className="space-y-4">
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">Application Settings</h3>
                <p className="text-muted-foreground">Configure your application preferences here.</p>
              </div>
              <div className="p-4 backdrop-blur-xl bg-foreground/5 rounded-lg border border-foreground/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-[var(--color-unicorn-blue)]/10 transition-all duration-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">Browser Settings</h3>
                <p className="text-muted-foreground">Customize browser behavior and security options.</p>
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
                    ) : (
                      <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-[#4285f4] to-[#34a853] flex items-center justify-center text-foreground text-xs font-bold">
                        {tab.url.includes("github") ? "G" : tab.url.includes("youtube") ? "Y" : "🌐"}
                      </div>
                    )}
                  </div>

                  {showTabTitle && <span className="truncate text-sm font-normal flex-1 min-w-0">{tab.title}</span>}

                  {tab.hasAudio && showTabTitle && (
                    <Volume2 className="h-3 w-3 text-[var(--color-unicorn-blue)] flex-shrink-0" />
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className={cn(
                      "flex-shrink-0 h-4 w-4 rounded-sm hover:bg-foreground/20 flex items-center justify-center transition-all duration-150",
                      showTabTitle ? "opacity-0 group-hover:opacity-100" : "opacity-100",
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
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
            <>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditAccount(account.id)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAddingGroup ? (
                    <div className="px-2 py-2 space-y-2">
                      <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Group name"
                        className="h-8 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddGroup()
                          if (e.key === "Escape") {
                            setIsAddingGroup(false)
                            setNewGroupName("")
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={handleAddGroup}
                          className="h-7 flex-1 text-xs bg-[var(--color-unicorn-blue)] hover:bg-[var(--color-unicorn-blue)]/80"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingGroup(false)
                            setNewGroupName("")
                          }}
                          className="h-7 flex-1 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingGroup(true)}
                      className="w-full justify-start gap-2 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150"
                    >
                      <FolderPlus className="h-4 w-4" />
                      <span className="text-xs">Add Group</span>
                    </Button>
                  )}

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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditAccount(account.id)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2 border-t border-foreground/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddAccountModalOpen(true)}
                  className="w-full justify-start gap-2 hover:bg-foreground/10 hover:text-[var(--color-unicorn-blue)] transition-all duration-150"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Add Account</span>
                </Button>
              </div>
            </>
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
        <div className="flex-1 backdrop-blur-sm bg-background/60 flex flex-col overflow-hidden">
          {renderMainContent()}
        </div>
      </div>

      <Dialog open={isAddAccountModalOpen} onOpenChange={setIsAddAccountModalOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-background/95 border border-[var(--color-unicorn-blue)]/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Add New Account</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Create a new account profile to manage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-name" className="text-sm font-medium text-foreground">
                Account Name
              </Label>
              <Input
                id="account-name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="e.g., John Doe"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                Username
              </Label>
              <Input
                id="username"
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                placeholder="e.g., johndoe"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group" className="text-sm font-medium text-foreground">
                Group
              </Label>
              <Select
                value={newAccount.groupId}
                onValueChange={(value) => setNewAccount({ ...newAccount, groupId: value })}
              >
                <SelectTrigger id="group" className="h-10">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {accountGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </Label>
              <Select
                value={newAccount.status}
                onValueChange={(value) => setNewAccount({ ...newAccount, status: value as AccountStatus })}
              >
                <SelectTrigger id="status" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="shadowban">Shadowban</SelectItem>
                  <SelectItem value="lock">Locked</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-sm font-medium text-foreground">
                Avatar Color
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={newAccount.color}
                  onChange={(e) => setNewAccount({ ...newAccount, color: e.target.value })}
                  className="h-10 w-20 cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: newAccount.color }}
                >
                  {newAccount.name[0]?.toUpperCase() || "?"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsAddAccountModalOpen(false)} className="h-10">
              Cancel
            </Button>
            <Button
              onClick={handleAddAccount}
              disabled={!newAccount.name.trim() || !newAccount.username.trim() || !newAccount.groupId}
              className="h-10 bg-[var(--color-unicorn-blue)] hover:bg-[var(--color-unicorn-blue)]/80"
            >
              Add Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
