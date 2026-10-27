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

  it('filters topics by science field tabs', () => {
    render(<App />);

    // 初期状態では全9テーマ表示
    expect(screen.getByText('すべて (9)')).toBeInTheDocument();

    // 「生物 (3)」をクリック
    const bioBtn = screen.getByText('🌿 生物 (3)');
    fireEvent.click(bioBtn);

    // 生物のテーマが表示され、物理のアルキメデスが表示されていないことを確認
    expect(screen.getByText('維管束の配置（内道外師）')).toBeInTheDocument();
    expect(screen.queryByText('アルキメデスの原理と浮力の計算')).not.toBeInTheDocument();

    // 「すべて」に戻す
    fireEvent.click(screen.getByText('すべて (9)'));
    expect(screen.getByText('アルキメデスの原理と浮力の計算')).toBeInTheDocument();
  });

  it('opens and flips 30-second flashcard modal', () => {
    render(<App />);

    // 「30秒暗記カード」ボタンをクリック
    const flashBtns = screen.getAllByText('⚡ 30秒暗記カード');
    fireEvent.click(flashBtns[0]);

    // モーダルが表示される
    expect(screen.getByTestId('flashcard-modal')).toBeInTheDocument();
    expect(screen.getByText('30秒フラッシュ暗記カード')).toBeInTheDocument();

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
});
