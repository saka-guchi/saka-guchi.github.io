import { db } from '../db';
import { ALL_PROGRESS_SKILLS } from '../data/all-skills';
import { getMemoryRetention } from './memory-retention';

const STREAK_STORAGE_KEY = 'junior_vet_study_streak';
const LAST_STUDY_DATE_KEY = 'junior_vet_last_study_date';

/**
 * 日本時間（Asia/Tokyo）の YYYY-MM-DD 形式の日付文字列を生成する
 */
export function getJstDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const yyyy = parts.find(p => p.type === 'year')?.value;
  const mm = parts.find(p => p.type === 'month')?.value;
  const dd = parts.find(p => p.type === 'day')?.value;

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 合格カルテ完成度（0〜100%）を計算する
 * 全37テーマの記憶定着メーター（忘却メーター）の平均値から算出
 */
export function calculateExamChartCompletion(): number {
  if (ALL_PROGRESS_SKILLS.length === 0) return 0;
  const total = ALL_PROGRESS_SKILLS.reduce((sum, skill) => {
    return sum + getMemoryRetention(skill.id);
  }, 0);
  return Math.round(total / ALL_PROGRESS_SKILLS.length);
}

/**
 * 連続学習日数（ストリーク）を算出する
 * データベースの dailySessions / attempts および localStorage の記録から厳密に判定
 */
export async function calculateStreakDays(): Promise<number> {
  try {
    const todayJst = getJstDateString(new Date());
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayJst = getJstDateString(yesterday);

    // 1. IndexedDB から学習日一覧を取得
    const sessions = await db.dailySessions.toArray();
    const completedDates = new Set<string>();

    for (const s of sessions) {
      if (s.completed && s.date) {
        completedDates.add(s.date);
      }
    }

    // attempts からも日付を補完
    const attempts = await db.attempts.toArray();
    for (const a of attempts) {
      if (a.timestamp) {
        completedDates.add(getJstDateString(new Date(a.timestamp)));
      }
    }

    // localStorage の記録も合算
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastDate = localStorage.getItem(LAST_STUDY_DATE_KEY);
      if (lastDate) {
        completedDates.add(lastDate);
      }
    }

    // 学習履歴が全くない場合
    if (completedDates.size === 0) {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STREAK_STORAGE_KEY);
        return saved ? parseInt(saved, 10) || 0 : 0;
      }
      return 0;
    }

    // 今日または昨日学習したかチェック（途切れていないか）
    const hasStudiedToday = completedDates.has(todayJst);
    const hasStudiedYesterday = completedDates.has(yesterdayJst);

    if (!hasStudiedToday && !hasStudiedYesterday) {
      // 連続学習が途切れている
      return 0;
    }

    // 遡って何日連続しているかをカウント
    let streak = 0;
    let checkDate = hasStudiedToday ? new Date() : yesterday;

    while (true) {
      const checkDateStr = getJstDateString(checkDate);
      if (completedDates.has(checkDateStr)) {
        streak++;
        // 1日前の日付へ
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    // localStorageへ最新値をキャッシュ
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STREAK_STORAGE_KEY, String(streak));
    }
    return streak;
  } catch {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STREAK_STORAGE_KEY);
      return saved ? parseInt(saved, 10) || 1 : 1;
    }
    return 1;
  }
}

/**
 * 今日の学習完了を記録し、ストリークを更新する
 */
export async function recordDailyStudyCompleted(): Promise<number> {
  const todayJst = getJstDateString(new Date());
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(LAST_STUDY_DATE_KEY, todayJst);
  }

  const streak = await calculateStreakDays();
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(STREAK_STORAGE_KEY, String(streak));
  }

  // ホーム画面等へ即時通知
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('study-streak-updated', { detail: { streak } }));
  }
  return streak;
}
