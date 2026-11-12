import { describe, it, expect } from 'vitest';
import {
  EXAM_INSPIRATIONAL_QUOTES,
  getDailyQuote,
  getRandomQuote,
} from '../../src/data/quotes';

describe('EXAM_INSPIRATIONAL_QUOTES & Helper functions', () => {
  it('contains valid quote items with required fields', () => {
    expect(EXAM_INSPIRATIONAL_QUOTES.length).toBeGreaterThanOrEqual(10);
    EXAM_INSPIRATIONAL_QUOTES.forEach(quote => {
      expect(quote.id).toBeTruthy();
      expect(quote.author).toBeTruthy();
      expect(quote.authorRole).toBeTruthy();
      expect(quote.quote).toBeTruthy();
      expect(quote.kidsExplanation).toBeTruthy();
      // 小学生向けの平易な言葉・解説であること
      expect(quote.kidsExplanation).toMatch(/よ[！!。]|ね[！!。]|んだ[！!。]/);
    });
  });

  it('calculates daily quote deterministically based on JST date', () => {
    // 同一日時なら必ず同じ名言を返す
    const date1 = new Date('2026-11-12T03:00:00Z'); // JST 12:00
    const date2 = new Date('2026-11-12T10:00:00Z'); // JST 19:00
    const quote1 = getDailyQuote(date1);
    const quote2 = getDailyQuote(date2);
    expect(quote1.id).toBe(quote2.id);

    // 翌日（JST）になればインデックスまたは結果が決定論的に算出される
    const date3 = new Date('2026-11-13T00:00:00Z');
    const quote3 = getDailyQuote(date3);
    expect(quote3).toBeDefined();
  });

  it('getRandomQuote returns a different quote when currentId is provided', () => {
    const first = EXAM_INSPIRATIONAL_QUOTES[0];
    for (let i = 0; i < 20; i++) {
      const next = getRandomQuote(first.id);
      expect(next.id).not.toBe(first.id);
    }
  });
});
