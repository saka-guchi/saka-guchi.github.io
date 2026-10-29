import { APP_VERSION, clearCacheAndReload } from '../version';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  buildTimestamp?: string;
  isOnline: boolean;
  error?: string;
}

/**
 * ネットワークに接続されているか判定する
 */
export function isNetworkConnected(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * サーバー上の最新バージョン情報を取得・照合し、新規バージョンがあるかチェックする
 * - 起動直後、またはユーザーの手動操作時に実行される
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const online = isNetworkConnected();

  // オフライン時はチェックをスキップ
  if (!online) {
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      isOnline: false,
    };
  }

  // 1. Service Worker の更新チェック（バックグラウンドで新しいsw.jsの取得を促す）
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update().catch(() => {});
        // 待機中の新しいServiceWorkerが存在する場合、確実にアップデートあり
        if (reg.waiting) {
          const result: UpdateCheckResult = {
            hasUpdate: true,
            currentVersion: APP_VERSION,
            isOnline: true,
          };
          notifyUpdateAvailable(result);
          return result;
        }
      }
    }
  } catch {
    // ignore SW check errors
  }

  // 2. サーバー上の version.json をキャッシュなしで直接フェッチして検証
  try {
    const url = `./version.json?_t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const serverVersion = data?.version;
      const buildTimestamp = data?.buildTimestamp;

      // サーバーバージョンが存在し、現在のクライアントバージョンと異なる場合にアップデートありと判定
      if (serverVersion && serverVersion !== APP_VERSION) {
        const result: UpdateCheckResult = {
          hasUpdate: true,
          currentVersion: APP_VERSION,
          latestVersion: serverVersion,
          buildTimestamp,
          isOnline: true,
        };
        notifyUpdateAvailable(result);
        return result;
      }

      return {
        hasUpdate: false,
        currentVersion: APP_VERSION,
        latestVersion: serverVersion || APP_VERSION,
        buildTimestamp,
        isOnline: true,
      };
    }
  } catch (err: any) {
    // ネットワークエラー等
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      isOnline: online,
      error: err?.message || 'バージョン情報の取得に失敗しました',
    };
  }

  return {
    hasUpdate: false,
    currentVersion: APP_VERSION,
    isOnline: true,
  };
}

/**
 * アップデートが利用可能なことをアプリ全体へ通知するカスタムイベントを発火
 */
function notifyUpdateAvailable(result: UpdateCheckResult) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app-update-available', {
        detail: result,
      })
    );
  }
}

/**
 * 新しいバージョンへアップデート（PWAキャッシュパージ & 強制リロード）を実行する
 */
export async function applyAppUpdate(): Promise<void> {
  // Service Worker に SKIP_WAITING を送出
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch {
      // ignore
    }
  }

  // キャッシュをクリアして最新版をリロード
  await clearCacheAndReload();
}

