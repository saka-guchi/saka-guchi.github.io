import { describe, it, expect } from 'vitest';
import { getExamScoreSummary, getAllExamScoreSummaries } from '../../src/utils/exam-scores';
import type { FinalChallengeResult } from '../../src/types';

describe('exam-scores utility tests', () => {
  it('未受験の年度・科目は bestScore が null で isPerfect が false であること', () => {
    const history: FinalChallengeResult[] = [];
    const summary = getExamScoreSummary(history, 2026, 'rika');

    expect(summary.bestScore).toBeNull();
    expect(summary.passed).toBe(false);
    expect(summary.isPerfect).toBe(false);
    expect(summary.attemptCount).toBe(0);
  });

  it('受験履歴がある場合、該当年度・科目の最高点を正確に算出すること', () => {
    const history: FinalChallengeResult[] = [
      {
        id: 1,
        examId: 'yasuda-2026-rika',
        stage: 1,
        score: 75,
        totalScore: 100,
        passed: false,
        timestamp: 1000,
        questionScores: {},
      },
      {
        id: 2,
        examId: 'yasuda-2026-rika',
        stage: 1,
        score: 85,
        totalScore: 100,
        passed: true,
        timestamp: 2000,
        questionScores: {},
      },
      {
        id: 3,
        examId: 'yasuda-2026-sansu',
        stage: 1,
        score: 90,
        totalScore: 100,
        passed: true,
        timestamp: 3000,
        questionScores: {},
      },
      {
        id: 4,
        examId: 'yasuda-2025-rika',
        stage: 1,
        score: 100,
        totalScore: 100,
        passed: true,
        timestamp: 4000,
        questionScores: {},
      },
    ];

    const rika2026 = getExamScoreSummary(history, 2026, 'rika');
    expect(rika2026.bestScore).toBe(85);
    expect(rika2026.passed).toBe(true);
    expect(rika2026.isPerfect).toBe(false);
    expect(rika2026.attemptCount).toBe(2);

    const rika2025 = getExamScoreSummary(history, 2025, 'rika');
    expect(rika2025.bestScore).toBe(100);
    expect(rika2025.passed).toBe(true);
    expect(rika2025.isPerfect).toBe(true); // 100点満点マスター判定
    expect(rika2025.attemptCount).toBe(1);
  });

  it('getAllExamScoreSummaries で全年度・全科目のサマリーが一括取得できること', () => {
    const history: FinalChallengeResult[] = [
      {
        id: 1,
        examId: 'yasuda-2026-kokugo',
        stage: 1,
        score: 100,
        totalScore: 100,
        passed: true,
        timestamp: 1000,
        questionScores: {},
      },
    ];

    const all = getAllExamScoreSummaries(history);
    expect(all[2026].kokugo.bestScore).toBe(100);
    expect(all[2026].kokugo.isPerfect).toBe(true);
    expect(all[2026].rika.bestScore).toBeNull();
    expect(all[2024].sansu.bestScore).toBeNull();
  });
});

