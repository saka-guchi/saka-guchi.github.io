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

  it('初期状態では全教科が選択されており、「全教科の本日の回診をスタート！ 🐾」と表示される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // 全教科選択ボタンがアクティブ
    const allBtn = screen.getByTestId('study-subject-all');
    expect(allBtn).toHaveTextContent(/✓ 🌟 全教科/);

    // ガイダンスとスタートボタン
    expect(screen.getByText(/出題教科（タップで複数選べるよ！）:/)).toBeInTheDocument();
    expect(screen.getByText('🌟 全教科ミックス')).toBeInTheDocument();

    const startBtn = screen.getByTestId('start-study-btn');
    expect(startBtn).toHaveTextContent('全教科の本日の回診をスタート！ 🐾');
  });

  it('理科と社会をタップして複数選択した際、ボタンが「理科・社会の本日の回診をスタート！ 🧪🗾」に変化し、ストアに複数科目が渡される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const rikaBtn = screen.getByTestId('study-subject-rika');
    const shakaiBtn = screen.getByTestId('study-subject-shakai');
    const startBtn = screen.getByTestId('start-study-btn');

    // 全教科選択状態から「理科」をタップ -> 理科のみ選択へ
    fireEvent.click(rikaBtn);
    expect(screen.getByText('🎯 1教科を選択中')).toBeInTheDocument();
    expect(startBtn).toHaveTextContent('理科の本日の回診をスタート！ 🧪');

    // 続けて「社会」をタップ -> 理科＋社会の複数選択へ
    fireEvent.click(shakaiBtn);
    expect(screen.getByText('🎯 2教科を選択中')).toBeInTheDocument();
    expect(startBtn).toHaveTextContent('理科・社会の本日の回診をスタート！ 🧪🗾');

    // スタートボタンをクリック
    fireEvent.click(startBtn);

    // ストアの問題セッションが理科または社会のみで構成されていること
    const sessionQuestions = useAppStore.getState().currentSessionQuestions;
    expect(sessionQuestions.length).toBeGreaterThan(0);
    sessionQuestions.forEach(q => {
      expect(['rika', 'shakai']).toContain(q.subject);
    });
  });

  it('「🌟 全教科」ボタンを押すと一撃で全教科選択に戻る', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const sansuBtn = screen.getByTestId('study-subject-sansu');
    const allBtn = screen.getByTestId('study-subject-all');
    const startBtn = screen.getByTestId('start-study-btn');

    // 算数のみに絞り込み
    fireEvent.click(sansuBtn);
    expect(startBtn).toHaveTextContent('算数の本日の回診をスタート！ 📐');

    // 「🌟 全教科」をタップして復帰
    fireEvent.click(allBtn);
    expect(allBtn).toHaveTextContent(/✓ 🌟 全教科/);
    expect(startBtn).toHaveTextContent('全教科の本日の回診をスタート！ 🐾');
  });
});

