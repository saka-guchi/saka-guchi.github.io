import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTotalPoints,
  getDailyPointsMap,
  getTodayPoints,
  getVetRank,
  getPointsSummary,
  awardSessionPoints,
  getPointsBySourceMap,
  VET_RANKS,
} from '../../src/utils/points-manager';

describe('points-manager 獣医師ストーリー＆元気のもと基盤テスト', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('初期状態では元気のもと0、見学生、第1章であること', () => {
    expect(getTotalPoints()).toBe(0);
    expect(getDailyPointsMap()).toEqual({});
    expect(getTodayPoints()).toBe(0);

    const summary = getPointsSummary();
    expect(summary.totalPoints).toBe(0);
    expect(summary.todayPoints).toBe(0);
    expect(summary.bySource).toEqual({
      daily_exam: 0,
      prescription: 0,
      case_study: 0,
      vet_challenge: 0,
    });
    expect(summary.currentRank.rankLevel).toBe(1);
    expect(summary.currentRank.title).toBe('見学生');
    expect(summary.currentRank.storyChapter).toBe('第1章: 森の動物病院へようこそ');
    expect(summary.nextRank?.title).toBe('研修医');
    expect(summary.pointsToNextRank).toBe(30);
    expect(summary.rankProgressPercent).toBe(0);
  });

  it('4大医療活動（診察・処方・症例・試験）ごとに元気のもとが正しく計上されること', () => {
    // 1. 本日の診察で 8個
    awardSessionPoints(8, 'daily_exam');
    // 2. 知識の処方箋で 10個
    awardSessionPoints(10, 'prescription');
    // 3. 症例スタディで 5個
    awardSessionPoints(5, 'case_study');
    // 4. 獣医師チャレンジで 25個
    awardSessionPoints(25, 'vet_challenge');

    const total = 8 + 10 + 5 + 25; // 48個
    expect(getTotalPoints()).toBe(total);
    expect(getTodayPoints()).toBe(total);

    const bySource = getPointsBySourceMap();
    expect(bySource.daily_exam).toBe(8);
    expect(bySource.prescription).toBe(10);
    expect(bySource.case_study).toBe(5);
    expect(bySource.vet_challenge).toBe(25);

    const summary = getPointsSummary();
    expect(summary.totalPoints).toBe(48);
    expect(summary.currentRank.title).toBe('研修医'); // 30個以上で研修医
    expect(summary.currentRank.storyChapter).toBe('第2章: はじめての聴診器');
  });

  it('日付が変わると今日の元気のもとは0から計算され、累計および分野別内訳は維持されること', () => {
    const yesterday = new Date('2026-10-31T12:00:00+09:00');
    awardSessionPoints(15, 'daily_exam', yesterday);

    expect(getTotalPoints()).toBe(15);
    expect(getTodayPoints('2026-10-31')).toBe(15);
    expect(getTodayPoints('2026-11-01')).toBe(0);

    const today = new Date('2026-11-01T10:00:00+09:00');
    awardSessionPoints(10, 'prescription', today);

    expect(getTotalPoints()).toBe(25);
    expect(getTodayPoints('2026-11-01')).toBe(10);
    expect(getTodayPoints('2026-10-31')).toBe(15);

    const bySource = getPointsBySourceMap();
    expect(bySource.daily_exam).toBe(15);
    expect(bySource.prescription).toBe(10);
  });

  it('最高ランクに達した場合のサマリー計算が安全であること', () => {
    awardSessionPoints(1000, 'vet_challenge');
    const summary = getPointsSummary();
    expect(summary.currentRank.title).toBe('院長');
    expect(summary.currentRank.storyChapter).toBe('最終章: 病院をまかされる日');
    expect(summary.nextRank).toBeNull();
    expect(summary.pointsToNextRank).toBe(0);
    expect(summary.rankProgressPercent).toBe(100);
  });
});
