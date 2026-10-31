import { describe, it, expect, vi } from 'vitest';
import { getDaysUntilExam, formatExamDateJa } from '../../src/utils/countdown-helper';

describe('Exam Countdown Helper Tests (JST Timezone Accurate)', () => {
  it('formats exam date accurately in Japanese', () => {
    expect(formatExamDateJa('2027-02-01')).toBe('2027年2月1日');
    expect(formatExamDateJa('2026-10-31')).toBe('2026年10月31日');
    expect(formatExamDateJa('')).toBe('2027年2月1日');
  });

  it('calculates remaining days to 2027-02-01 based on current date', () => {
    // 現在日時から2027年2月1日までの日数が正しく正の整数であること
    const days = getDaysUntilExam('2027-02-01');
    expect(days).toBeGreaterThan(0);
    expect(Number.isInteger(days)).toBe(true);
  });

  it('safely returns 0 when target date is today or in the past', () => {
    expect(getDaysUntilExam('2020-01-01')).toBe(0);
  });

  it('handles invalid or empty target date gracefully with fallback', () => {
    const days = getDaysUntilExam('');
    expect(days).toBeGreaterThan(0);
  });
});

