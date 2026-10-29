import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { App } from '../../src/App';
import { checkForAppUpdate, isNetworkConnected } from '../../src/utils/version-checker';
import { AppUpdateBanner } from '../../src/components/AppUpdateBanner';
import { APP_VERSION } from '../../src/version';

describe('PWA Version Update & Automatic Check Feature', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('determines network connection status correctly', () => {
    expect(isNetworkConnected()).toBe(true);
  });

  it('detects new version when server version differs from current APP_VERSION', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        version: '9.9.9',
        buildTimestamp: '2026-10-29 23:00:00 (日本時間)',
      }),
    } as any);

    const result = await checkForAppUpdate();
    expect(result.hasUpdate).toBe(true);
    expect(result.latestVersion).toBe('9.9.9');
    expect(result.isOnline).toBe(true);
  });

  it('reports no update when server version is equal to current APP_VERSION', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        version: APP_VERSION,
        buildTimestamp: '2026-10-29 22:35:00 (日本時間)',
      }),
    } as any);

    const result = await checkForAppUpdate();
    expect(result.hasUpdate).toBe(false);
    expect(result.latestVersion).toBe(APP_VERSION);
  });

  it('renders AppUpdateBanner with update button when update is available, and allows dismissing it', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: APP_VERSION }),
    } as any);

    render(<AppUpdateBanner />);

    // 最初はバナーなし
    expect(screen.queryByTestId('app-update-banner')).not.toBeInTheDocument();

    // アップデート通知イベントを発火
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('app-update-available', {
          detail: {
            hasUpdate: true,
            latestVersion: '2.0.0',
            currentVersion: APP_VERSION,
            isOnline: true,
          },
        })
      );
    });

    // バナーが出現することを確認
    await waitFor(() => {
      expect(screen.getByTestId('app-update-banner')).toBeInTheDocument();
    });

    expect(screen.getByTestId('latest-version-tag')).toHaveTextContent('v2.0.0');
    expect(screen.getByTestId('apply-update-btn')).toHaveTextContent('今すぐバージョンアップ ❯');

    // 「✕」ボタンでバナーを閉じる
    fireEvent.click(screen.getByTestId('dismiss-update-btn'));
    expect(screen.queryByTestId('app-update-banner')).not.toBeInTheDocument();
  });

  it('renders manual update check button on HomePage footer and triggers check', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        version: APP_VERSION,
      }),
    } as any);

    render(<App />);

    const manualCheckBtn = screen.getByTestId('manual-update-check-btn');
    expect(manualCheckBtn).toBeInTheDocument();
    expect(manualCheckBtn).toHaveTextContent('🔄 更新をチェック');

    await act(async () => {
      fireEvent.click(manualCheckBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('manual-update-check-btn')).toHaveTextContent('✅ 最新版です');
    });
  });
});


