import { describe, it, expect } from 'vitest';
import {
  ALL_PAST_EXAM_QUESTIONS,
  selectBalancedDailyExamQuestions,
} from '../../src/data/past-exam-questions';
import { SUPPORTED_EXAM_YEARS } from '../../src/data/final-challenge-data';

describe('Past Exam Questions Generation & Balance Tests', () => {
  it('generates questions for all supported exam years', () => {
    expect(ALL_PAST_EXAM_QUESTIONS.length).toBeGreaterThan(350);

    const yearCounts: Record<number, number> = {
      2026: 0,
      2025: 0,
      2024: 0,
      2023: 0,
      2022: 0,
    };

    for (const q of ALL_PAST_EXAM_QUESTIONS) {
      for (const year of SUPPORTED_EXAM_YEARS) {
        if (q.id.includes(String(year)) || (q.source && q.source.includes(String(year)))) {
          yearCounts[year]++;
          break;
        }
      }
    }

    console.log('Past exam question counts by year:', yearCounts);

    // 全年度（2022〜2026年）で50問以上の問題が生成されていること
    expect(yearCounts[2026]).toBeGreaterThanOrEqual(50);
    expect(yearCounts[2025]).toBeGreaterThanOrEqual(50);
    expect(yearCounts[2024]).toBeGreaterThanOrEqual(50);
    expect(yearCounts[2023]).toBeGreaterThanOrEqual(50);
    expect(yearCounts[2022]).toBeGreaterThanOrEqual(50);
  });

  it('selects balanced questions covering multiple exam years in daily session', () => {
    // 10問の回診で全5年度（2022, 2023, 2024, 2025, 2026）がバランスよく抽出されること
    const selected10 = selectBalancedDailyExamQuestions(ALL_PAST_EXAM_QUESTIONS, 10);
    expect(selected10.length).toBe(10);

    const yearsCovered = new Set<number>();
    for (const q of selected10) {
      for (const year of SUPPORTED_EXAM_YEARS) {
        if (q.id.includes(String(year)) || (q.source && q.source.includes(String(year)))) {
          yearsCovered.add(year);
          break;
        }
      }
    }

    console.log('Years covered in 10-question session:', Array.from(yearsCovered));
    // 10問中、少なくとも4年度以上（理想は全5年度）がカバーされること
    expect(yearsCovered.size).toBeGreaterThanOrEqual(4);
    // 2024年度以外の年度が含まれていること
    const non2024Years = Array.from(yearsCovered).filter(y => y !== 2024);
    expect(non2024Years.length).toBeGreaterThanOrEqual(3);
  });

  it('verifies choices randomization ensures correct answer is not always "ア"', () => {
    const choiceQuestions = ALL_PAST_EXAM_QUESTIONS.filter(q => q.format === 'multiple_choice');
    expect(choiceQuestions.length).toBeGreaterThan(50);

    // 複数回セッションを生成して正解インデックスの分散を検証
    const correctAnswers = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const session = selectBalancedDailyExamQuestions(choiceQuestions, 10);
      for (const q of session) {
        if (q.format === 'multiple_choice') {
          correctAnswers.add(q.correctAnswer);
        }
      }
    }

    // 'a', 'b', 'c', 'd' の各位置に正解が分散していること
    expect(correctAnswers.has('a')).toBe(true);
    expect(correctAnswers.has('b')).toBe(true);
    expect(correctAnswers.has('c')).toBe(true);
    expect(correctAnswers.has('d')).toBe(true);
  });
});
