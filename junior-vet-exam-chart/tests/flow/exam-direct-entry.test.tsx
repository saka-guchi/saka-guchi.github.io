import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { FinalChallengePage } from '../../src/pages/FinalChallengePage';
import { db } from '../../src/db';

describe('ドクター認定試験 年度別・科目別入り口＆最高点表示 総合結合テスト', () => {
  beforeEach(async () => {
    await db.finalChallengeResults.clear();
  });

  it('トップページの認定試験欄に年度タブと科目ごとの入り口ボタンが表示され、初期状態では「未受験」が表示されること', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // 認定試験エリアが存在すること
    expect(screen.getByTestId('card-final-challenge')).toBeInTheDocument();
    expect(screen.getByTestId('exam-entry-section')).toBeInTheDocument();

    // 年度タブが表示されていること（2026, 2025, 2024, 2023, 2022）
    expect(screen.getByTestId('home-exam-year-tab-2026')).toBeInTheDocument();
    expect(screen.getByTestId('home-exam-year-tab-2025')).toBeInTheDocument();
    expect(screen.getByTestId('home-exam-year-tab-2024')).toBeInTheDocument();

    // 2026年度の初期科目カードが表示されていること
    expect(screen.getByTestId('exam-entry-card-2026-rika')).toBeInTheDocument();
    expect(screen.getByTestId('exam-entry-card-2026-sansu')).toBeInTheDocument();
    expect(screen.getByTestId('exam-entry-card-2026-shakai')).toBeInTheDocument();
    expect(screen.getByTestId('exam-entry-card-2026-kokugo')).toBeInTheDocument();

    // 未受験表示
    const scoreBadge = screen.getByTestId('best-score-2026-rika');
    expect(scoreBadge).toHaveTextContent('未受験');
  });

  it('受験履歴が存在する場合、過去の最高点が表示され、100点満点の場合は特別なデザイン（👑 100点 満点！）になること', async () => {
    // 過去履歴の投入: 2026年理科は85点、2026年算数は100点（満点）
    await db.finalChallengeResults.bulkAdd([
      {
        examId: 'yasuda-2026-rika',
        stage: 1,
        score: 70,
        totalScore: 100,
        passed: false,
        timestamp: 1000,
        questionScores: {},
      },
      {
        examId: 'yasuda-2026-rika',
        stage: 1,
        score: 85,
        totalScore: 100,
        passed: true,
        timestamp: 2000,
        questionScores: {},
      },
      {
        examId: 'yasuda-2026-sansu',
        stage: 1,
        score: 100,
        totalScore: 100,
        passed: true,
        timestamp: 3000,
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

    // 理科（85点・合格）の表示検証
    await waitFor(() => {
      const rikaBadge = screen.getByTestId('best-score-2026-rika');
      expect(rikaBadge).toHaveTextContent('85点');
      expect(rikaBadge).toHaveTextContent('合格');
    });

    // 算数（100点・満点）の特別デザイン検証
    const sansuBadge = screen.getByTestId('best-score-2026-sansu');
    expect(sansuBadge).toHaveTextContent('100点');
    expect(sansuBadge).toHaveTextContent('満点！');
    expect(sansuBadge).toHaveTextContent('👑');

    // 算数カードに満点クラスが付与されていること
    const sansuCard = screen.getByTestId('exam-entry-card-2026-sansu');
    expect(sansuCard.className).toContain('examSubjectCardPerfect');

    // 算数ボタンの文言が「もう一度満点に挑む」になっていること
    const sansuBtn = screen.getByTestId('start-exam-btn-2026-sansu');
    expect(sansuBtn).toHaveTextContent('👑 もう一度満点に挑む');
  });

  it('トップページの科目ボタンをクリックすると、指定した年度・科目の試験ページへ直接遷移し、その科目で開始されること', async () => {
    // 2026年算数100点の履歴あり
    await db.finalChallengeResults.add({
      examId: 'yasuda-2026-sansu',
      stage: 1,
      score: 100,
      totalScore: 100,
      passed: true,
      timestamp: 3000,
      questionScores: {},
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/final-challenge" element={<FinalChallengePage />} />
        </Routes>
      </MemoryRouter>
    );

    // 算数のボタンをクリック
    const startSansuBtn = await screen.findByTestId('start-exam-btn-2026-sansu');
    fireEvent.click(startSansuBtn);

    // FinalChallengePage に遷移し、2026年度・算数が選択されていること
    expect(await screen.findByTestId('final-challenge-page')).toBeInTheDocument();
    const activeSansuTab = screen.getByTestId('subject-tab-sansu');
    expect(activeSansuTab.className).toContain('activeSubjectTab');

    // ヘッダーに算数の最高点（👑 100点 満点！）が表示されていること
    await waitFor(() => {
      const headerScoreBadge = screen.getByTestId('header-best-score-badge');
      expect(headerScoreBadge).toHaveTextContent('100点 満点！');
    });

    // 算数の制限時間（50分）が表示されていること
    expect(screen.getByTestId('challenge-timer')).toHaveTextContent('50:00');
  });

  it('全年度表示トグルをクリックすると、全年度のグループと科目ボタンが一括表示されること', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByTestId('toggle-all-years-btn');
    expect(toggleBtn).toHaveTextContent('全年度をまとめて表示');

    fireEvent.click(toggleBtn);

    // 全年度のグループが表示されること
    expect(screen.getByTestId('exam-year-group-2026')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-group-2025')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-group-2024')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-group-2023')).toBeInTheDocument();
    expect(screen.getByTestId('exam-year-group-2022')).toBeInTheDocument();

    // 再度クリックでタブ表示に戻ること
    fireEvent.click(screen.getByTestId('toggle-all-years-btn'));
    expect(screen.getByTestId('exam-year-tabs')).toBeInTheDocument();
  });
});
