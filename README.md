# Desktop App - Next.js + Electron UI

Next.jsアプリケーションをElectronのUIとして使用するデスクトップアプリプロジェクトです。Next.jsアプリがElectronのユーザーインターフェースとして機能します。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発環境での実行

```bash
# Next.js開発サーバーとElectronを同時に起動
npm run dev

# または個別に実行
npm run dev:next    # Next.js開発サーバーのみ
npm run dev:electron # Electronのみ（Next.jsサーバーが起動後）
```

### 3. テスト実行（React UIをビルドしてElectronで表示）

```bash
# React UIをビルドしてElectronでテスト実行
npm run test:full

# または段階的に実行
npm run test:build    # React UIをビルド
npm run test:electron # ビルド済みUIをElectronで表示

# クリーンビルド（既存のビルドファイルを削除してから実行）
npm run test:clean
```

### 4. 本番ビルド

```bash
# 静的ファイルを生成してElectronアプリをビルド
npm run build

# パッケージ化（配布用ファイル生成）
npm run electron:pack

# 完全な配布用ビルド
npm run electron:dist
```

## 利用可能なスクリプト

### 開発用
- `npm run dev` - 開発環境でNext.jsとElectronを同時実行
- `npm run dev:next` - Next.js開発サーバーのみ
- `npm run dev:electron` - Electronのみ（Next.jsサーバーが起動後）

### テスト用
- `npm run test:build` - React UIをビルド
- `npm run test:electron` - ビルド済みUIをElectronで表示
- `npm run test:full` - ビルド→Electron実行を一括実行
- `npm run test:clean` - クリーンビルド→Electron実行

### 本番用
- `npm run build` - Next.jsアプリを静的ファイルとしてビルド
- `npm run electron` - ビルド済みファイルでElectronを実行
- `npm run electron:pack` - パッケージ化（配布用）
- `npm run electron:dist` - 完全な配布用ビルド

## プロジェクト構造

```
desktop-app/
├── app/                 # Next.jsアプリケーション
├── components/          # Reactコンポーネント
├── electron/           # Electronメインプロセス
│   └── main.js        # Electronのエントリーポイント
├── out/               # ビルド済み静的ファイル（生成される）
├── public/            # 静的アセット
├── electron-builder.json # Electron Builder設定
└── next.config.mjs    # Next.js設定
```

## 技術スタック

- **Next.js 14** - Reactフレームワーク（UI層）
- **Electron 28** - デスクトップアプリフレームワーク（UIコンテナ）
- **Tailwind CSS** - スタイリング
- **TypeScript** - 型安全性
- **Radix UI** - UIコンポーネント

## Electron UI としての特徴

- **Next.jsアプリがUI**: Next.jsアプリケーションがElectronのユーザーインターフェースとして機能
- **レスポンシブデザイン**: デスクトップアプリとして最適化されたUI
- **高速レンダリング**: Next.jsの静的生成による高速UI
- **モダンなUI**: Tailwind CSSとRadix UIによる美しいデザイン
- **クロスプラットフォーム**: Windows、macOS、Linuxで動作

## Electron UI としての動作

1. **開発環境**: Next.jsの開発サーバー（localhost:3000）にElectronが接続してUIを表示
2. **テスト環境**: React UIをビルドして静的ファイル（`out/`ディレクトリ）をElectronが読み込んでUIを表示
3. **本番環境**: 静的ファイル（`out/`ディレクトリ）をElectronが読み込んでUIを表示
4. **UI最適化**: デスクトップアプリとして最適化されたウィンドウサイズとレイアウト
5. **パフォーマンス**: Next.jsの静的生成による高速UIレンダリング
6. **テスト機能**: テスト環境ではDevToolsが自動で開き、デバッグが容易

## トラブルシューティング

### Electronが起動しない場合
- Next.jsサーバーが起動しているか確認
- `npm run build`で静的ファイルが生成されているか確認

### ビルドエラーが発生する場合
- Node.jsのバージョンが適切か確認
- `node_modules`を削除して`npm install`を再実行

## 配布

`npm run electron:dist`を実行すると、`dist/`ディレクトリに各OS用のインストーラーが生成されます：

- **Windows**: `.exe`インストーラー
- **macOS**: `.dmg`ファイル
- **Linux**: `.AppImage`ファイル