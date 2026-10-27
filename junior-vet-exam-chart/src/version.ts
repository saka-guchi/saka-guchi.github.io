// アプリバージョン・ビルドメタ情報
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0';

export const BUILD_TIMESTAMP: string =
  typeof __BUILD_TIMESTAMP__ !== 'undefined'
    ? __BUILD_TIMESTAMP__
    : new Date().toISOString().replace('T', ' ').slice(0, 19);

/**
 * Service Worker および CacheStorage を完全パージして最新のWebアプリを強制再取得する
 */
export async function clearCacheAndReload(): Promise<void> {
  try {
    // 1. Service Worker の登録解除
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 2. CacheStorage (キャッシュ) の全削除
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  } catch (err) {
    console.error('Failed to clear caches:', err);
  } finally {
    // 3. キャッシュバスター付きでリロード
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(Date.now()));
    window.location.href = url.toString();
  }
}
