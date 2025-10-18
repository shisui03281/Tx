/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Electron UI用の設定
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // assetPrefix は削除（next/font が先頭スラッシュを要求するため）
  // assetPrefixを削除（next/fontとの互換性のため）
  // Electron UI用の最適化
  swcMinify: false, // Electron用にSWCミニファイを無効化
  compress: false, // Electron用に圧縮を無効化
  poweredByHeader: false,
  // Electron UI用の追加設定
  env: {
    ELECTRON: 'true',
  },
  // パフォーマンス最適化
  compiler: {
    removeConsole: false, // Electron用にコンソールログを保持
  },
  // Electron用の追加設定
  experimental: {
    esmExternals: false,
  },
  // 開発環境でのWebSocket設定
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 開発環境でのWebSocket設定を改善
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // 開発サーバー設定
  devIndicators: {
    buildActivity: false,
  },
}

export default nextConfig
