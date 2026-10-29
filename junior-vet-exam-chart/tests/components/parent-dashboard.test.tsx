import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

    // 印刷専用ワークシートの存在確認
    const worksheet = screen.getByTestId('print-weakness-worksheet');
    expect(worksheet).toBeInTheDocument();
    expect(worksheet).toHaveTextContent('🩺 みならい獣医さんの中学受験カルテ 【A4弱点集中 克服チェックシート】');
    expect(worksheet).toHaveTextContent('【第1問】');
    expect(worksheet).toHaveTextContent('【第2問】');
    expect(worksheet).toHaveTextContent('【第3問】');
    expect(worksheet).toHaveTextContent('💡 急所ポイント＆解法のコツ:');
    expect(worksheet).toHaveTextContent('保護者確認印');
    expect(worksheet).toHaveTextContent('問1 答え:');
  });

  it('allows expanding parent advice accordion and triggers onStartWeaknessQuiz without closing parent modal', async () => {
    const handleClose = vi.fn();
    const handleStartWeakness = vi.fn();
    render(<ParentDashboardModal onClose={handleClose} onStartWeaknessQuiz={handleStartWeakness} />);

    // タブ3へ移動
    const printTab = screen.getByTestId('parent-tab-print');
    fireEvent.click(printTab);

    // 弱点TOP3セクション内の指導ヒント展開ボタンを探す
    const guideBtns = screen.getAllByRole('button', { name: /急所・指導ヒントを見る/ });
    expect(guideBtns.length).toBeGreaterThan(0);

    // 1問目のガイドを展開
    fireEvent.click(guideBtns[0]);
    expect(screen.getByText(/お子さんのつまずき急所:/)).toBeInTheDocument();
    expect(screen.getByText(/家庭での声かけ・解法のコツ:/)).toBeInTheDocument();
    expect(screen.getByText(/出題される問題の例:/)).toBeInTheDocument();

    // 「お子さんにこの単元を解かせる」ボタンをクリック
    const startQuizBtn = screen.getByRole('button', { name: /お子さんにこの単元を解かせる/ });
    fireEvent.click(startQuizBtn);

    // 暗記カード開始コールバックが呼ばれ、かつ保護者カルテは閉じない（handleCloseは呼ばれない）
    expect(handleStartWeakness).toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
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

  it('keeps parent modal open when launching and closing quick flashcard from weakness tab', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // 保護者カルテを開く
    const headerBtn = screen.getByTestId('header-parent-btn');
    fireEvent.click(headerBtn);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '保護者カルテ' })).toBeInTheDocument();
    });

    // タブ3へ移動
    const printTab = screen.getByTestId('parent-tab-print');
    fireEvent.click(printTab);

    // 指導ヒントを展開
    const guideBtns = screen.getAllByRole('button', { name: /急所・指導ヒントを見る/ });
    fireEvent.click(guideBtns[0]);

    // お子さんに解かせる（暗記カード起動）
    const startQuizBtn = screen.getByRole('button', { name: /お子さんにこの単元を解かせる/ });
    fireEvent.click(startQuizBtn);

    // 暗記カードが前面に表示され、かつ保護者カルテも背後で維持されている
    await waitFor(() => {
      expect(screen.getByTestId('flashcard-modal')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '保護者カルテ' })).toBeInTheDocument();
    });

    // 暗記カード内の「✕」閉じるボタンをクリック
    const flashcardModal = screen.getByTestId('flashcard-modal');
    const flashCardCloseBtn = within(flashcardModal).getByLabelText('閉じる');
    fireEvent.click(flashCardCloseBtn);

    // 暗記カードは閉じ、保護者カルテは開いたまま維持される（トップ画面に抜けない）
    await waitFor(() => {
      expect(screen.queryByTestId('flashcard-modal')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '保護者カルテ' })).toBeInTheDocument();
    });
  });
});
