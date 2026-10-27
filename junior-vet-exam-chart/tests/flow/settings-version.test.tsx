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

    // バックアップ＆復元セクションが存在すること
    expect(screen.getByTestId('backup-section')).toBeInTheDocument();
    expect(screen.getByTestId('export-history-btn')).toBeInTheDocument();
    expect(screen.getByTestId('import-history-label')).toBeInTheDocument();
    expect(screen.getByTestId('reset-history-btn')).toBeInTheDocument();
  });

  it('imports history from JSON backup file and displays success message', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react');
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const input = screen.getByTestId('import-history-input');
    const mockBackup = {
      app: 'junior-vet-exam-chart',
      version: '1.2.0',
      exportedAt: '2026-10-27T12:00:00.000Z',
      attempts: [
        { id: 1, questionId: 'q-yasuda-2024-r1-1', timestamp: 1700000000000, isCorrect: true, userChoice: 'ア', durationMs: 12000 }
      ],
      masteries: [
        { skillId: 'sci-plant-flower', stage: 'master', score: 100, lastUpdated: 1700000000000 }
      ]
    };
    const file = new File([JSON.stringify(mockBackup)], 'backup.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('backup-status-box')).toHaveTextContent('復元が完了しました！');
    });
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

