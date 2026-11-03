import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { db } from '../../src/db';

describe('ドクター認定試験 年度別・科目別コンパクト入り口＆最高点表示＆新報酬 総合結合テスト', () => {
  beforeEach(async () => {
    await db.finalChallengeResults.clear();
  });

  it('トップページの認定試験欄に年度別・科目別の1行レイアウトが表示され、初期状態では「未受験」が表示されること', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // 認定試験エリアが存在すること
    expect(screen.getByTestId('card-final-challenge')).toBeInTheDocument();
    expect(screen.getByText('実際の入試問題で力試しをしよう')).toBeInTheDocument();

    // 報酬カード・過去の成績表ボタンが存在すること
    expect(screen.getByTestId('challenge-reward-card')).toBeInTheDocument();
    expect(screen.getByTestId('open-exam-history-btn')).toBeInTheDocument();

    // 2026年度〜2022年度の各行が表示されていること
    expect(screen.getByTestId('exam-year-row-2026')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-row-2025')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-row-2024')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-row-2023')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-row-2022')).toBeInTheDocument();

    // 2026年度の初期科目ボタンが存在し、「未受験」が表示されていること
    const rikaBtn = screen.getByTestId('start-exam-btn-2026-rika');
    expect(rikaBtn).toHaveTextContent('理科');
    expect(rikaBtn).toHaveTextContent('(未受験)');

    // 脚注が存在すること
    expect(screen.getByText('※カッコ内は過去の最高得点')).toBeInTheDocument();
  });

  it('受験履歴が存在する場合、過去の最高点が表示され、100点満点の場合は特別なゴールドデザイン（👑 算数 (100点)）になること', async () => {
    // 過去履歴の投入: 2026年理科は85点（銅）、2026年算数は100点（金・満点）
    await db.finalChallengeResults.bulkAdd([
      {
        examId: 'yasuda-2026-rika',
        stage: 1,
        score: 85,
        totalScore: 100,
        passed: true,
        timestamp: 1000,
        questionScores: {},
      },
      {
        examId: 'yasuda-2026-sansu',
        stage: 1,
        score: 100,
        totalScore: 100,
        passed: true,
        timestamp: 2000,
        questionScores: {},
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // 理科（85点・銅バッジクラス）の表示検証
    await waitFor(() => {
      const rikaBtn = screen.getByTestId('start-exam-btn-2026-rika');
      expect(rikaBtn).toHaveTextContent('(85点)');
      expect(rikaBtn.className).toContain('compactExamBtnBronze');
    });

    // 算数（100点・金・王冠特別デザイン）の検証
    const sansuBtn = screen.getByTestId('start-exam-btn-2026-sansu');
    expect(sansuBtn).toHaveTextContent('👑');
    expect(sansuBtn).toHaveTextContent('算数');
    expect(sansuBtn).toHaveTextContent('(100点)');
    expect(sansuBtn.className).toContain('compactExamBtnPerfect');
  });

  it('トップページの科目ボタンをクリックすると、指定した年度・科目の試験ページへ直接遷移し、初期状態で原本スキャンが表示されること', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/final-challenge" element={<FinalChallengePage />} />
        </Routes>
      </MemoryRouter>
    );

    // 2026年理科ボタンをクリック
    const rikaBtn = screen.getByTestId('start-exam-btn-2026-rika');
    fireEvent.click(rikaBtn);

    // FinalChallengePage に遷移し、2026年度・理科が選択されていること
    expect(await screen.findByTestId('final-challenge-page')).toBeInTheDocument();
    const activeRikaTab = screen.getByTestId('subject-tab-rika');
    expect(activeRikaTab.className).toContain('activeSubjectTab');

    // デフォルトで原本スキャン画像が表示されていること
    expect(screen.getByTestId('exam-page-image')).toBeInTheDocument();

    // 理科なのでStage 2（同等未見問題）タブは活性化していること
    const stage2Tab = screen.getByTestId('stage-2-tab');
    expect(stage2Tab).not.toBeDisabled();
  });
});
