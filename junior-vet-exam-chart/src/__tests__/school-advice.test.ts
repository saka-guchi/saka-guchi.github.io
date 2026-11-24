import { describe, it, expect, beforeEach } from 'vitest';
import {
  SCHOOL_ADVICE_DATA,
} from '../data/school-advice-data';
import {
  getTodayJstDate,
  getTodayCheckedItemIds,
  toggleAdviceItemCheck,
  resetTodayChecks,
  getAllItemIdsForSchool,
  getSchoolCompletionStats,
  getAllAdviceItemsFlat,
  getDailyPickupAdvice,
} from '../utils/school-advice';

describe('School Advice Feature', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('contains both Chiyoda and Meguro school advice data', () => {
    expect(SCHOOL_ADVICE_DATA.chiyoda).toBeDefined();
    expect(SCHOOL_ADVICE_DATA.meguro).toBeDefined();

    // 千代田: 共通・国語・算数・理科・社会の5セクション
    expect(SCHOOL_ADVICE_DATA.chiyoda.sections.length).toBe(5);
    // 英語が含まれていないことの検証
    const chiyodaHasEnglish = SCHOOL_ADVICE_DATA.chiyoda.sections.some(s =>
      s.title.includes('英語') || s.doctorTitle.includes('英語')
    );
    expect(chiyodaHasEnglish).toBe(false);

    // 多摩大目黒: 絶対ルール・算数の2セクション
    expect(SCHOOL_ADVICE_DATA.meguro.sections.length).toBe(2);
    expect(SCHOOL_ADVICE_DATA.meguro.sections[0].id).toBe('meguro-warn');
  });

  it('returns valid JST date string in YYYY-MM-DD format', () => {
    const todayStr = getTodayJstDate();
    expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('toggles advice check state and stores in localStorage with JST key', () => {
    const itemId = 'chiyoda-common-1';
    expect(getTodayCheckedItemIds().has(itemId)).toBe(false);

    const checked = toggleAdviceItemCheck(itemId);
    expect(checked).toBe(true);
    expect(getTodayCheckedItemIds().has(itemId)).toBe(true);

    const unchecked = toggleAdviceItemCheck(itemId);
    expect(unchecked).toBe(false);
    expect(getTodayCheckedItemIds().has(itemId)).toBe(false);
  });

  it('correctly calculates school completion statistics', () => {
    const chiyodaAll = getAllItemIdsForSchool(SCHOOL_ADVICE_DATA.chiyoda);
    expect(chiyodaAll.length).toBeGreaterThan(15);

    const initialStats = getSchoolCompletionStats('chiyoda');
    expect(initialStats.checked).toBe(0);
    expect(initialStats.total).toBe(chiyodaAll.length);
    expect(initialStats.percent).toBe(0);

    toggleAdviceItemCheck(chiyodaAll[0]);
    toggleAdviceItemCheck(chiyodaAll[1]);

    const updatedStats = getSchoolCompletionStats('chiyoda');
    expect(updatedStats.checked).toBe(2);
    expect(updatedStats.percent).toBe(Math.round((2 / chiyodaAll.length) * 100));

    resetTodayChecks('chiyoda');
    const resetStats = getSchoolCompletionStats('chiyoda');
    expect(resetStats.checked).toBe(0);
  });

  it('returns deterministic pickup advice based on date string', () => {
    const all = getAllAdviceItemsFlat();
    expect(all.length).toBeGreaterThan(20);

    const advice1 = getDailyPickupAdvice('2026-11-24');
    const advice2 = getDailyPickupAdvice('2026-11-24');
    expect(advice1.item.id).toBe(advice2.item.id);

    const adviceNext = getDailyPickupAdvice('2026-11-24', 1);
    expect(adviceNext).toBeDefined();
  });
});
