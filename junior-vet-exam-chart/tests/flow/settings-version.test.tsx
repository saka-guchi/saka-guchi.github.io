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

  it('学習履歴の初期化を実行しても、こころのデータ（private, shared, meta）は保持・保護されること', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react');
    
    // こころのデータをセット
    localStorage.setItem('jvet:private:sorting_cards', JSON.stringify([{ id: 'c1', text: '悩み' }]));
    localStorage.setItem('jvet:shared:weather_daily', JSON.stringify({ '2026-11-03': { weather: 'sunny' } }));
    localStorage.setItem('jvet:meta:parent_pin', JSON.stringify({ enabled: true, testHash: 'abc' }));
    // 通常の学習進度データ
    localStorage.setItem('junior_vet_memory_retention_sci-plant', '80');
    localStorage.setItem('junior_vet_earned_stamps', JSON.stringify(['cat-mike']));

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // 学習履歴の初期化ボタンを2回タップ
    const resetBtn = screen.getByTestId('reset-history-btn');
    fireEvent.click(resetBtn);
    expect(screen.getByText('本当に初期化しますか？（タップで確定）')).toBeInTheDocument();
    fireEvent.click(screen.getByText('本当に初期化しますか？（タップで確定）'));

    await waitFor(() => {
      expect(screen.getByTestId('backup-status-box')).toHaveTextContent('学習履歴・カルテ進度をすべて初期化しました');
    });

    // 通常の学習履歴は初期化されている
    expect(localStorage.getItem('junior_vet_memory_retention_sci-plant')).toBeNull();
    expect(localStorage.getItem('junior_vet_earned_stamps')).toBeNull();

    // 重要: こころのデータは一切削除されず完全維持されていること（指示E案A検証）
    expect(localStorage.getItem('jvet:private:sorting_cards')).not.toBeNull();
    expect(localStorage.getItem('jvet:shared:weather_daily')).not.toBeNull();
    expect(localStorage.getItem('jvet:meta:parent_pin')).not.toBeNull();
  });

  it('「こころの記録を初期化」ボタンでこころのデータのみ完全に初期化できること', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react');

    localStorage.setItem('jvet:private:sorting_cards', JSON.stringify([{ id: 'c1' }]));
    localStorage.setItem('jvet:shared:weather_daily', JSON.stringify({ '2026-11-03': { weather: 'sunny' } }));
    localStorage.setItem('jvet:meta:parent_pin', JSON.stringify({ enabled: true }));
    localStorage.setItem('junior_vet_memory_retention_sci-plant', '80');

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const clearMentalBtn = screen.getByTestId('clear-mental-care-btn');
    fireEvent.click(clearMentalBtn);
    expect(screen.getByText('こころの記録を全削除しますか？（タップで確定）')).toBeInTheDocument();
    fireEvent.click(screen.getByText('こころの記録を全削除しますか？（タップで確定）'));

    await waitFor(() => {
      expect(screen.getByTestId('backup-status-box')).toHaveTextContent('こころの記録（相談室・見守りデータ・PIN）をすべて削除しました');
    });

    // こころのデータが削除されている
    expect(localStorage.getItem('jvet:private:sorting_cards')).toBeNull();
    expect(localStorage.getItem('jvet:shared:weather_daily')).toBeNull();
    expect(localStorage.getItem('jvet:meta:parent_pin')).toBeNull();

    // 通常の学習履歴は残っている
    expect(localStorage.getItem('junior_vet_memory_retention_sci-plant')).toBe('80');
  });
});

