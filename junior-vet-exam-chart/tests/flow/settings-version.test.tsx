import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsPage } from '../../src/pages/SettingsPage';
import { HomePage } from '../../src/pages/HomePage';
import { MemoryRouter } from 'react-router-dom';
import { APP_VERSION } from '../../src/version';

describe('Version Management and Cache Control', () => {
  it('displays app version and build timestamp on SettingsPage', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // アプリ・バージョン情報セクションが存在すること
    expect(screen.getByTestId('app-version-section')).toBeInTheDocument();
    expect(screen.getByTestId('app-version-value')).toHaveTextContent(`v${APP_VERSION}`);
    expect(screen.getByTestId('build-timestamp-value')).toBeInTheDocument();

    // キャッシュ削除・最新版更新ボタンが存在すること
    expect(screen.getByTestId('clear-cache-btn')).toBeInTheDocument();
  });

  it('displays app version in the footer on HomePage', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const footer = screen.getByTestId('home-footer-version');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(`v${APP_VERSION}`);
  });
});

