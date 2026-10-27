import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../../src/App';
import { useAppStore } from '../../src/store/appStore';

describe('UI Redesign & New Features Integration Tests', () => {
  beforeEach(() => {
    window.location.hash = '#/';
    useAppStore.getState().resetSession();
    localStorage.clear();
  });

  it('cycles through color themes when clicking the theme button', () => {
    render(<App />);

    const themeBtn = screen.getByLabelText('テーマ切り替え');
    expect(themeBtn).toBeInTheDocument();

    // 1回目のクリックで sakura
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('sakura');
    expect(localStorage.getItem('junior_vet_theme')).toBe('sakura');

    // 2回目のクリックで mint
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('mint');
    expect(localStorage.getItem('junior_vet_theme')).toBe('mint');

    // 3回目のクリックで lavender
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('lavender');
    expect(localStorage.getItem('junior_vet_theme')).toBe('lavender');

    // 4回目のクリックで night
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');
    expect(localStorage.getItem('junior_vet_theme')).toBe('night');

    // 5回目のクリックで default（属性削除）
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('toggles sound effects button', () => {
    render(<App />);
    const soundBtn = screen.getByLabelText('効果音切り替え');
    expect(soundBtn).toBeInTheDocument();

    // デフォルトは🔔
    expect(soundBtn).toHaveTextContent('🔔');

    // クリックで消音🔕
    fireEvent.click(soundBtn);
    expect(soundBtn).toHaveTextContent('🔕');

    // 再度クリックで有効化🔔
    fireEvent.click(soundBtn);
    expect(soundBtn).toHaveTextContent('🔔');
  });

  it('filters topics by subject tabs (Science, Math, Social Studies)', () => {
    render(<App />);

    // 初期状態では全37テーマ表示
    expect(screen.getByText('🌟 すべて (37)')).toBeInTheDocument();

    // 「🧪 理科 (9)」をクリック
    const rikaBtn = screen.getByText('🧪 理科 (9)');
    fireEvent.click(rikaBtn);

    // 理科のテーマが表示され、算数のテーマが表示されていないことを確認
    expect(screen.getByText('維管束の配置（内道外師）')).toBeInTheDocument();
    expect(screen.queryByText('つるかめ算と消去算の条件整理')).not.toBeInTheDocument();

    // 「📐 算数 (14)」をクリック
    const sansuBtn = screen.getByText('📐 算数 (14)');
    fireEvent.click(sansuBtn);

    // 算数のテーマが表示され、理科のテーマが表示されていないことを確認
    expect(screen.getByText('つるかめ算と消去算の条件整理')).toBeInTheDocument();
    expect(screen.queryByText('維管束の配置（内道外師）')).not.toBeInTheDocument();

    // 「🌟 すべて (37)」に戻す
    fireEvent.click(screen.getByText('🌟 すべて (37)'));
    expect(screen.getByText('維管束の配置（内道外師）')).toBeInTheDocument();
    expect(screen.getByText('つるかめ算と消去算の条件整理')).toBeInTheDocument();
  });

  it('opens and flips 30-second flashcard modal', () => {
    render(<App />);

    // 「30秒暗記カード」ボタンをクリック
    const flashBtns = screen.getAllByText('⚡ 30秒暗記カード');
    fireEvent.click(flashBtns[0]);

    // モーダルが表示される
    expect(screen.getByTestId('flashcard-modal')).toBeInTheDocument();
    expect(screen.getByText('30秒フラッシュ暗記カード')).toBeInTheDocument();

    // 科目バッジが「🧪 理科」であり、高校分野の「生物」ではないこと
    expect(screen.getByTestId('flashcard-subject-badge')).toHaveTextContent('🧪 理科');
    expect(screen.queryByText('生物')).not.toBeInTheDocument();

    // 表面の問題が表示されている
    expect(screen.getByText('【問題】頭の中でパッと思い出せるかな？')).toBeInTheDocument();

    // カードをタップして裏返す
    const flipArea = screen.getByText('👆 タップして【答えと獣医ポイント】を見る');
    fireEvent.click(flipArea);

    // 裏面の解答が表示される
    expect(screen.getByText('✨ ズバリ解答！')).toBeInTheDocument();

    // 閉じるボタンで閉じる
    const closeBtn = screen.getByLabelText('閉じる');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('flashcard-modal')).not.toBeInTheDocument();
  });

  it('displays mentor cat message and streak counter', () => {
    render(<App />);
    expect(screen.getByText(/ナース猫のミケちゃん:/)).toBeInTheDocument();
    expect(screen.getByText('3日れんぞく！')).toBeInTheDocument();
  });

  it('toggles cheer message and vet fact on stamp click in animal stamp album', () => {
    render(<App />);
    // スタンプ帳ボタンをクリック
    const stampAlbumBtn = screen.getByTestId('open-stamp-book-btn');
    fireEvent.click(stampAlbumBtn);

    // シール帳モーダルが開く
    expect(screen.getByText('🐾 みならい獣医さんの動物シール帳')).toBeInTheDocument();

    // 獲得済みスタンプ（テスト初期状態では1番目 stamp-dog-shiba などが獲得済み）
    // クリック前は「👆 タップすると鳴き声と豆知識が飛び出すよ！」が表示されている
    const promptNotice = screen.getAllByText('👆 タップすると鳴き声と豆知識が飛び出すよ！')[0];
    expect(promptNotice).toBeInTheDocument();
    expect(screen.queryByTestId('stamp-cheer-stamp-dog-shiba')).not.toBeInTheDocument();

    // スタンプをクリック
    const dogStamp = screen.getByTestId('animal-stamp-stamp-dog-shiba');
    fireEvent.click(dogStamp);

    // クリック後に鳴き声と豆知識が飛び出す！
    expect(screen.getByTestId('stamp-cheer-stamp-dog-shiba')).toBeInTheDocument();
    expect(screen.getByTestId('stamp-fact-stamp-dog-shiba')).toBeInTheDocument();
  });

  it('opens exam history modal from HomePage', () => {
    render(<App />);
    const historyBtn = screen.getByTestId('open-exam-history-btn');
    fireEvent.click(historyBtn);

    expect(screen.getByTestId('exam-history-modal')).toBeInTheDocument();
    expect(screen.getByText('合格ドクター認定試験 採点カルテ・成績表')).toBeInTheDocument();
  });
});
