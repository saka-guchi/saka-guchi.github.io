import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { ResultPage } from '../../src/pages/ResultPage';
import { SettingsPage } from '../../src/pages/SettingsPage';
import { useAppStore } from '../../src/store/appStore';
import { awardSessionPoints, getTotalPoints, getTodayPoints, getPointsBySourceMap } from '../../src/utils/points-manager';

describe('獣医師ストーリー ＆ どうぶつ元気のもと統合 UI/UX 結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAppStore.setState({
      currentSessionQuestions: [
        {
          id: 'q1',
          subject: 'rika',
          format: 'multiple_choice',
          prompt: '植物の光合成で発生する気体は？',
          choices: [
            { id: 'c1', label: 'ア', text: '酸素', isCorrect: true },
            { id: 'c2', label: 'イ', text: '二酸化炭素', isCorrect: false },
          ],
          correctAnswer: 'c1',
          explanation: { resultSummary: '正解', keyTakeaway: '光合成', reasoning: '解説' },
        },
      ],
      correctCount: 8,
      directRecallCount: 5,
      sessionResults: [],
      promotedSkillInfo: null,
    });
  });

  it('1. ホーム画面のヘッダーに総合元気のもとバッジが表示され、診察カード内の重複ボックスはヘッダーへ集約（非表示）されていること', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // ヘッダーの総合バッジ
    const headerBadge = screen.getByTestId('header-points-badge');
    expect(headerBadge).toBeInTheDocument();
    expect(headerBadge).toHaveTextContent(/きょう \+0 こ/);
    expect(headerBadge).toHaveTextContent(/累計 0 こ/);

    // 本日の診察カード内の重複ステータスボックスは削除されていること（ヘッダーからアクセス可能）
    expect(screen.queryByTestId('today-points-card')).not.toBeInTheDocument();
  });

    it('2. トップページに現在のランクと獣医師ストーリーカードが表示され、手帳を開くと4大医療活動の歩みが確認できること', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // トップページに獣医師ストーリー＆ランクカードが表示されていること
    expect(screen.getByTestId('current-rank-card')).toBeInTheDocument();
    expect(screen.getByTestId('current-rank-card')).toHaveTextContent(/第1章/);
    expect(screen.getByTestId('current-rank-card')).toHaveTextContent('見学生');
    expect(screen.getByTestId('rank-story-excerpt')).toHaveTextContent(/獣医師ストーリー:/);

    // カード内の「手帳を見る」ボタンをクリックすると手帳モーダルが開くこと
    const storyNotebookBtn = screen.getByTestId('story-card-notebook-btn');
    fireEvent.click(storyNotebookBtn);

    // 手帳モーダルが表示されていること
    const modal = screen.getByTestId('points-notebook-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/どうぶつ元気のもと手帳/)).toBeInTheDocument();

    // 4大医療活動の歩みセクション
    expect(screen.getByTestId('story-sources-section')).toBeInTheDocument();
    expect(screen.getByTestId('source-card-daily_exam')).toHaveTextContent('本日の診察');
    expect(screen.getByTestId('source-card-prescription')).toHaveTextContent('知識の処方箋');
    expect(screen.getByTestId('source-card-case_study')).toHaveTextContent('症例スタディ');
    expect(screen.getByTestId('source-card-vet_challenge')).toHaveTextContent('獣医師チャレンジ');

    // 手帳をとじる
    const closeBtn = screen.getByTestId('modal-bottom-close-btn');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('points-notebook-modal')).not.toBeInTheDocument();
  });

  it('3. 今日の10問（ResultPage）を解くと、正解数に応じた元気のもと獲得カードが表示され、本日の診察として計上されること', () => {
    render(
      <MemoryRouter>
        <ResultPage />
      </MemoryRouter>
    );

    const card = screen.getByTestId('points-award-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('どうぶつ元気のもと獲得！');
    expect(card).toHaveTextContent('+8元気のもと 獲得！');

    // localStorageに保存
    expect(getTotalPoints()).toBe(8);
    const bySource = getPointsBySourceMap();
    expect(bySource.daily_exam).toBe(8);
  });

  it('4. 4大活動（処方・症例・試験）からも元気のもとが付与され、獣医師ストーリーの手帳に反映されること', () => {
    awardSessionPoints(10, 'prescription');
    awardSessionPoints(5, 'case_study');
    awardSessionPoints(20, 'vet_challenge');

    const bySource = getPointsBySourceMap();
    expect(bySource.prescription).toBe(10);
    expect(bySource.case_study).toBe(5);
    expect(bySource.vet_challenge).toBe(20);
    expect(getTotalPoints()).toBe(35); // 30個以上で「研修医」に昇格
  });

  it('5. ランク昇格の閾値（30こ）を超えた場合、ランクアップ祝賀バナーが表示されること', () => {
    awardSessionPoints(25, 'daily_exam');
    useAppStore.setState({ correctCount: 8 });

    render(
      <MemoryRouter>
        <ResultPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('rank-up-banner')).toBeInTheDocument();
    expect(screen.getByText(/獣医師ランクがアップしました！/)).toBeInTheDocument();
    expect(screen.getByText(/【見学生】から【研修医 🐾】に昇格！/)).toBeInTheDocument();
  });

  it('6. 設定画面（SettingsPage）で学習履歴をリセットすると元気のもと数と分野別内訳も0に初期化されること', async () => {
    awardSessionPoints(50, 'vet_challenge');
    expect(getTotalPoints()).toBe(50);

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const resetBtn = screen.getByTestId('reset-history-btn');
    fireEvent.click(resetBtn); // step 1
    fireEvent.click(resetBtn); // step 2: 確定実行

    await waitFor(() => {
      expect(getTotalPoints()).toBe(0);
      expect(getPointsBySourceMap().vet_challenge).toBe(0);
    });
  });

  it('7. 4大医療活動（本日の診察、処方箋、症例スタディ、獣医師チャレンジ）のヘッダー右側に元気のもと獲得数が表示されること', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const dailyBadge = screen.getByTestId('reward-badge-daily');
    expect(dailyBadge).toBeInTheDocument();
    expect(dailyBadge).toHaveTextContent(/元気のもと \+1個/);

    const prescriptionBadge = screen.getByTestId('reward-badge-prescription');
    expect(prescriptionBadge).toBeInTheDocument();
    expect(prescriptionBadge).toHaveTextContent(/元気のもと \+1個/);

    const caseStudyBadge = screen.getByTestId('reward-badge-case-study');
    expect(caseStudyBadge).toBeInTheDocument();
    expect(caseStudyBadge).toHaveTextContent(/元気のもと \+1個/);

    const challengeBadge = screen.getByTestId('reward-badge-challenge');
    expect(challengeBadge).toBeInTheDocument();
    expect(challengeBadge).toHaveTextContent(/元気のもと \+20個/);
  });
});
