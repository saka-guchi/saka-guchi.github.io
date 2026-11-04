import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { useAppStore } from '../../src/store/appStore';

describe('今日のカルテ学習 出題教科の複数選択（マルチセレクト）UI/UX 結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('初期状態では全4教科が選択されており、説明文が「忘れてそうな入試問題が出題されるよ」、ボタンが「▶ 本日の診察をはじめる（10問）」と表示される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 「全教科」単体ボタンは廃止され、存在しないこと
    expect(screen.queryByTestId('study-subject-all')).toBeNull();

    // 4教科すべてが初期状態で選択状態
    expect(screen.getByTestId('study-subject-rika')).toHaveTextContent(/✓ 🧪 理科/);
    expect(screen.getByTestId('study-subject-sansu')).toHaveTextContent(/✓ 📐 算数/);
    expect(screen.getByTestId('study-subject-shakai')).toHaveTextContent(/✓ 🗾 社会/);
    expect(screen.getByTestId('study-subject-kokugo')).toHaveTextContent(/✓ 📖 国語/);

    // 説明文とカウント表示
    expect(screen.getByText('忘れてそうな入試問題が出題されるよ')).toBeInTheDocument();
    expect(screen.getByText(/出題教科（タップで複数選べるよ！）:/)).toBeInTheDocument();
    expect(screen.getByText('🌟 全教科ミックス')).toBeInTheDocument();

    // スタートボタン
    const startBtn = screen.getByTestId('start-study-btn');
    expect(startBtn).toHaveTextContent('▶ 本日の診察をはじめる（10問）');
  });

  it('教科をタップして理科と社会のみに絞り込んだ場合でも、ボタンは常に「▶ 本日の診察をはじめる（10問）」であり、ストアに選択された科目が正しく渡される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const rikaBtn = screen.getByTestId('study-subject-rika');
    const sansuBtn = screen.getByTestId('study-subject-sansu');
    const shakaiBtn = screen.getByTestId('study-subject-shakai');
    const kokugoBtn = screen.getByTestId('study-subject-kokugo');
    const startBtn = screen.getByTestId('start-study-btn');

    // 算数と国語を解除して、理科・社会の2教科に絞り込み
    fireEvent.click(sansuBtn);
    expect(screen.getByText('🎯 3教科を選択中')).toBeInTheDocument();
    expect(startBtn).toHaveTextContent('▶ 本日の診察をはじめる（10問）');

    fireEvent.click(kokugoBtn);
    expect(screen.getByText('🎯 2教科を選択中')).toBeInTheDocument();
    expect(startBtn).toHaveTextContent('▶ 本日の診察をはじめる（10問）');

    // 理科・社会が選択状態、算数・国語が未選択状態であることを検証
    expect(rikaBtn).toHaveTextContent(/✓ 🧪 理科/);
    expect(shakaiBtn).toHaveTextContent(/✓ 🗾 社会/);
    expect(sansuBtn).not.toHaveTextContent('✓');
    expect(kokugoBtn).not.toHaveTextContent('✓');

    // スタートボタンをクリック
    fireEvent.click(startBtn);

    // ストアの問題セッションが理科または社会のみで構成されていること
    const sessionQuestions = useAppStore.getState().currentSessionQuestions;
    expect(sessionQuestions.length).toBeGreaterThan(0);
    sessionQuestions.forEach(q => {
      expect(['rika', 'shakai']).toContain(q.subject);
    });
  });

  it('最後の1教科は解除できず、最低1教科の選択が維持される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const rikaBtn = screen.getByTestId('study-subject-rika');
    const sansuBtn = screen.getByTestId('study-subject-sansu');
    const shakaiBtn = screen.getByTestId('study-subject-shakai');
    const kokugoBtn = screen.getByTestId('study-subject-kokugo');

    // 算数・社会・国語を解除して理科1教科のみにする
    fireEvent.click(sansuBtn);
    fireEvent.click(shakaiBtn);
    fireEvent.click(kokugoBtn);

    expect(screen.getByText('🎯 1教科を選択中')).toBeInTheDocument();
    expect(rikaBtn).toHaveTextContent(/✓ 🧪 理科/);

    // 最後の理科をタップしても解除されず、理科1教科が維持される
    fireEvent.click(rikaBtn);
    expect(screen.getByText('🎯 1教科を選択中')).toBeInTheDocument();
    expect(rikaBtn).toHaveTextContent(/✓ 🧪 理科/);

    // 未選択の算数をタップすれば再び2教科に増える
    fireEvent.click(sansuBtn);
    expect(screen.getByText('🎯 2教科を選択中')).toBeInTheDocument();
    expect(sansuBtn).toHaveTextContent(/✓ 📐 算数/);
  });
});
