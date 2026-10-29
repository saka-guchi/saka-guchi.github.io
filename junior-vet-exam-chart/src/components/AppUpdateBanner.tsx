import React, { useState, useEffect } from 'react';
import { checkForAppUpdate, applyAppUpdate, type UpdateCheckResult } from '../utils/version-checker';
import { sound } from '../utils/sound-effects';
import styles from './AppUpdateBanner.module.css';

export const AppUpdateBanner: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 1. 起動直後（マウント時）にネットワークがあれば新規バージョンを自動チェック
    checkForAppUpdate().then((res) => {
      if (isMounted && res.hasUpdate) {
        setUpdateInfo(res);
      }
    });

    // 2. アップデート検知カスタムイベントのリスナー
    const handleUpdateAvailable = (e: any) => {
      if (!isMounted) return;
      if (e.detail?.hasUpdate) {
        setUpdateInfo(e.detail);
        setIsDismissed(false);
      }
    };

    // 3. オンライン復帰時の自動チェックリスナー
    const handleOnline = () => {
      checkForAppUpdate().then((res) => {
        if (isMounted && res.hasUpdate) {
          setUpdateInfo(res);
        }
      });
    };

    window.addEventListener('app-update-available', handleUpdateAvailable);
    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      window.removeEventListener('app-update-available', handleUpdateAvailable);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!updateInfo || !updateInfo.hasUpdate || isDismissed) {
    return null;
  }

  const handleUpdate = async () => {
    sound.playChime();
    setIsUpdating(true);
    await applyAppUpdate();
  };

  const handleDismiss = () => {
    sound.playPop();
    setIsDismissed(true);
  };

  return (
    <div className={styles.banner} role="alert" data-testid="app-update-banner">
      <div className={styles.content}>
        <span className={styles.icon}>🚀</span>
        <div>
          <span>新しいバージョンが利用可能です！</span>
          {updateInfo.latestVersion && (
            <span className={styles.versionTag} data-testid="latest-version-tag">
              v{updateInfo.latestVersion}
            </span>
          )}
          <span style={{ fontSize: '11px', opacity: 0.9, marginLeft: '6px' }}>
            （機能追加・不具合修正が届いています）
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.updateBtn}
          onClick={handleUpdate}
          disabled={isUpdating}
          data-testid="apply-update-btn"
          title="最新のアプリにアップデートしてリロードします"
        >
          {isUpdating ? '🔄 更新中...' : '今すぐバージョンアップ ❯'}
        </button>
        <button
          className={styles.closeBtn}
          onClick={handleDismiss}
          aria-label="後で"
          title="閉じる（後で更新）"
          data-testid="dismiss-update-btn"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

