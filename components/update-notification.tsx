'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, AlertCircle, X } from 'lucide-react';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export default function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    // アプリバージョンを取得
    if (window.electronAPI?.updater) {
      window.electronAPI.updater.getAppVersion().then((result: any) => {
        setAppVersion(result.version);
      });

      // 更新イベントリスナーを設定
      window.electronAPI.updater.onUpdateChecking(() => {
        setUpdateStatus('checking');
        setErrorMessage('');
      });

      window.electronAPI.updater.onUpdateAvailable((info: UpdateInfo) => {
        setUpdateStatus('available');
        setUpdateInfo(info);
        setErrorMessage('');
      });

      window.electronAPI.updater.onUpdateNotAvailable(() => {
        setUpdateStatus('idle');
        setErrorMessage('');
      });

      window.electronAPI.updater.onUpdateError((error: string) => {
        setUpdateStatus('error');
        setErrorMessage(error);
      });

      window.electronAPI.updater.onUpdateDownloadProgress((progress: UpdateProgress) => {
        setUpdateStatus('downloading');
        setUpdateProgress(progress);
      });

      window.electronAPI.updater.onUpdateDownloaded((info: UpdateInfo) => {
        setUpdateStatus('downloaded');
        setUpdateInfo(info);
      });
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (window.electronAPI?.updater) {
      try {
        await window.electronAPI.updater.checkForUpdates();
      } catch (error) {
        setUpdateStatus('error');
        setErrorMessage('更新チェックに失敗しました');
      }
    }
  };

  const handleDownloadUpdate = async () => {
    if (window.electronAPI?.updater) {
      try {
        await window.electronAPI.updater.downloadUpdate();
      } catch (error) {
        setUpdateStatus('error');
        setErrorMessage('ダウンロードに失敗しました');
      }
    }
  };

  const handleInstallUpdate = async () => {
    if (window.electronAPI?.updater) {
      try {
        await window.electronAPI.updater.installUpdate();
      } catch (error) {
        setUpdateStatus('error');
        setErrorMessage('インストールに失敗しました');
      }
    }
  };

  const handleDismiss = () => {
    setUpdateStatus('idle');
    setUpdateInfo(null);
    setUpdateProgress(null);
    setErrorMessage('');
  };

  if (updateStatus === 'idle') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            アプリケーション情報
          </CardTitle>
          <CardDescription>
            現在のバージョン: {appVersion}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCheckForUpdates} className="w-full">
            更新をチェック
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (updateStatus === 'checking') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500 animate-spin" />
            更新をチェック中...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            最新の更新を確認しています...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (updateStatus === 'available') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            更新が利用可能です
          </CardTitle>
          <CardDescription>
            新しいバージョン {updateInfo?.version} が利用可能です
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {updateInfo?.releaseNotes && (
            <div className="text-sm">
              <strong>リリースノート:</strong>
              <p className="mt-1 text-muted-foreground">{updateInfo.releaseNotes}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleDownloadUpdate} className="flex-1">
              ダウンロード
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (updateStatus === 'downloading') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            更新をダウンロード中...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>進捗</span>
              <span>{Math.round(updateProgress?.percent || 0)}%</span>
            </div>
            <Progress value={updateProgress?.percent || 0} className="w-full" />
          </div>
          {updateProgress && (
            <div className="text-xs text-muted-foreground">
              速度: {Math.round(updateProgress.bytesPerSecond / 1024)} KB/s
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (updateStatus === 'downloaded') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            ダウンロード完了
          </CardTitle>
          <CardDescription>
            更新の準備ができました。アプリケーションを再起動してインストールしますか？
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleInstallUpdate} className="flex-1">
              今すぐ再起動
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              後で
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (updateStatus === 'error') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || '不明なエラーが発生しました'}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleCheckForUpdates} variant="outline" className="flex-1">
              再試行
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
