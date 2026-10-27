import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ParentDashboardModal } from '../../src/components/ParentDashboardModal';
import { HomePage } from '../../src/pages/HomePage';
import { db } from '../../src/db';

// window.print のモック
Object.defineProperty(window, 'print', {
  value: vi.fn(),
  writable: true,
});

describe('ParentDashboardModal Component & Integration Tests', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.finalChallengeResults.clear();
    await db.dailySessions.clear();
    await db.attempts.clear();
  });

  it('renders summary statistics and tabs correctly', async () => {
    const handleClose = vi.fn();
    render(<ParentDashboardModal onClose={handleClose} />);

    // タイトル
    expect(screen.getByRole('heading', { name: '保護者カルテ' })).toBeInTheDocument();

    // 3つのタブ
    expect(screen.getByTestId('parent-tab-charts')).toBeInTheDocument();
    expect(screen.getByTestId('parent-tab-advice')).toBeInTheDocument();
    expect(screen.getByTestId('parent-tab-print')).toBeInTheDocument();

    // 統計サマリーカード
    expect(screen.getByText(/連続学習日数/)).toBeInTheDocument();
    expect(screen.getByText(/累計解答数/)).toBeInTheDocument();
    expect(screen.getByText(/推定総学習時間/)).toBeInTheDocument();
    expect(screen.getByText(/元気にした動物/)).toBeInTheDocument();

    // 閉じるボタン
    const closeBtn = screen.getByLabelText('閉じる');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('switches between tabs and allows goal editing and achievement toggle', async () => {
    render(<ParentDashboardModal onClose={() => {}} />);

    // 最初はグラフタブが表示
    expect(screen.getByText(/直近14日間の学習問題数推移/)).toBeInTheDocument();
    expect(screen.getByText(/本番認定試験の得点推移/)).toBeInTheDocument();

    // 「🐱 ほめ言葉＆お約束」タブに切り替え
    const adviceTab = screen.getByTestId('parent-tab-advice');
    fireEvent.click(adviceTab);

    expect(screen.getByText(/ナース猫ミケちゃんからの「今日のお子さんへの声かけヒント」/)).toBeInTheDocument();
    expect(screen.getByText(/親子のごほうび約束メモ/)).toBeInTheDocument();

    // 約束メモの編集
    const editBtn = screen.getByText('✏️ 編集する');
    fireEvent.click(editBtn);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '理科の認定試験で90点取ったら動物園！' } });

    const saveBtn = screen.getByText('保存する');
    fireEvent.click(saveBtn);

    expect(screen.getByText('理科の認定試験で90点取ったら動物園！')).toBeInTheDocument();
    expect(localStorage.getItem('junior_vet_reward_goal')).toBe('理科の認定試験で90点取ったら動物園！');

    // 達成トグル
    const achieveBtn = screen.getByText('⬜ 達成したらチェック！');
    fireEvent.click(achieveBtn);
    expect(screen.getByText('🎉 約束達成！おめでとう！')).toBeInTheDocument();
    expect(localStorage.getItem('junior_vet_reward_achieved')).toBe('true');

    // 「🖨️ 弱点処方箋＆A4印刷」タブに切り替え
    const printTab = screen.getByTestId('parent-tab-print');
    fireEvent.click(printTab);

    expect(screen.getByText(/A4弱点克服チェックシートを印刷/)).toBeInTheDocument();
    const printButton = screen.getByTestId('print-worksheet-btn');
    fireEvent.click(printButton);
    expect(window.print).toHaveBeenCalled();
  });

  it('triggers onStartWeaknessQuiz callback when weakness challenge button is clicked', async () => {
    const handleStartWeakness = vi.fn();
    render(<ParentDashboardModal onClose={() => {}} onStartWeaknessQuiz={handleStartWeakness} />);

    // タブ3へ移動
    const printTab = screen.getByTestId('parent-tab-print');
    fireEvent.click(printTab);

    // 弱点TOP3セクション内の挑戦ボタンを探す
    const challengeBtns = screen.getAllByRole('button', { name: /この単元を解く/ });
    expect(challengeBtns.length).toBeGreaterThan(0);

    fireEvent.click(challengeBtns[0]);
    expect(handleStartWeakness).toHaveBeenCalled();
  });

  it('opens parent dashboard modal from HomePage triggers', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // ヘッダーのボタンをクリック
    const headerBtn = screen.getByTestId('header-parent-btn');
    fireEvent.click(headerBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '保護者カルテ' })).toBeInTheDocument();
    });

    // 閉じる
    const closeBtn = screen.getByLabelText('閉じる');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: '保護者カルテ' })).not.toBeInTheDocument();
    });
  });
});
