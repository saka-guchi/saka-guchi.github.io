import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../src/store/appStore';
import { getQuestionSource } from '../../src/utils/source-helper';
import { SUPPORTED_EXAM_YEARS } from '../../src/data/final-challenge-data';

describe('本日の回診 過去問出題バランス 結合テスト', () => {
  beforeEach(() => {
    useAppStore.setState({
      settings: {
        recallDelaySeconds: 'auto',
        soundEnabled: true,
        vibrationEnabled: false,
        fontSize: 'standard',
        colorVisionSupport: false,
        dailyQuestionCount: 10,
        targetExamDate: '2027-02-01',
      },
    });
  });

  it('全教科で回診を開始した際、2024年度以外の過去問（2022, 2023, 2025, 2026）が確実に含まれること', () => {
    const store = useAppStore.getState();
    store.startDailySession();

    const state = useAppStore.getState();
    const sessionQuestions = state.currentSessionQuestions;

    expect(sessionQuestions.length).toBe(10);

    const yearSet = new Set<number>();
    const sources = sessionQuestions.map(q => {
      const src = getQuestionSource(q);
      for (const year of SUPPORTED_EXAM_YEARS) {
        if (src.includes(String(year)) || q.id.includes(String(year))) {
          yearSet.add(year);
        }
      }
      return src;
    });

    console.log('本日の回診 出題問題の出典一覧:', sources);
    console.log('出題された年度一覧:', Array.from(yearSet));

    // 2024年度以外の年度が複数含まれていること
    const non2024Years = Array.from(yearSet).filter(y => y !== 2024);
    expect(non2024Years.length).toBeGreaterThanOrEqual(3);

    // 少なくとも4年度以上がカバーされていること
    expect(yearSet.size).toBeGreaterThanOrEqual(4);
  });

  it('特定科目（理科・社会など）に絞り込んで回診を開始した場合も、複数年度の過去問がバランスよく出題されること', () => {
    const store = useAppStore.getState();
    store.startDailySession(['rika', 'shakai']);

    const state = useAppStore.getState();
    const sessionQuestions = state.currentSessionQuestions;

    expect(sessionQuestions.length).toBe(10);
    expect(sessionQuestions.every(q => q.subject === 'rika' || q.subject === 'shakai')).toBe(true);

    const yearSet = new Set<number>();
    for (const q of sessionQuestions) {
      const src = getQuestionSource(q);
      for (const year of SUPPORTED_EXAM_YEARS) {
        if (src.includes(String(year)) || q.id.includes(String(year))) {
          yearSet.add(year);
        }
      }
    }

    const non2024Years = Array.from(yearSet).filter(y => y !== 2024);
    expect(non2024Years.length).toBeGreaterThanOrEqual(2);
  });

  it('出題される過去問の出典バッジが「202X年度 安田学園中学校 〇〇」と正確に表示されること', () => {
    const store = useAppStore.getState();
    store.startDailySession();

    const state = useAppStore.getState();
    for (const q of state.currentSessionQuestions) {
      const src = getQuestionSource(q);
      expect(src).toMatch(/202[2-6]年度 安田学園中学校 (理科|算数|社会|国語)/);
    }
  });
});

