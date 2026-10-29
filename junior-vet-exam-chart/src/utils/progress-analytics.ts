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

export interface TodayStudyStats {
  questionCount: number;
  studyMinutes: number;
  accuracy: number;
  streakDays: number;
  totalAttempts: number;
  totalMinutes: number;
}

/**
 * 本日の学習量（推定時間、解答数、正答率、連続日数、累計）を集計する
 */
export async function getTodayStudyStats(): Promise<TodayStudyStats> {
  try {
    const todayJst = getJstDateString(new Date());

    const [sessions, attempts, streakDays] = await Promise.all([
      db.dailySessions.toArray(),
      db.attempts.toArray(),
      calculateStreakDays(),
    ]);

    // 今日のセッション
    const todaySession = sessions.find(s => s.date === todayJst);
    const sessionCount = todaySession?.questionIds?.length || 0;

    // 今日のattempts
    const todayAttempts = attempts.filter(a => a.timestamp && getJstDateString(new Date(a.timestamp)) === todayJst);
    const attemptCount = todayAttempts.length;

    const questionCount = Math.max(sessionCount, attemptCount);

    // 正答率
    let accuracy = 0;
    if (todayAttempts.length > 0) {
      const correct = todayAttempts.filter(a => a.isCorrect).length;
      accuracy = Math.round((correct / todayAttempts.length) * 100);
    } else if (todaySession?.results && todaySession.results.length > 0) {
      const correct = todaySession.results.filter(r => r.isCorrect).length;
      accuracy = Math.round((correct / todaySession.results.length) * 100);
    }

    // 今日の学習時間（分）: 実測値または目安（10問で約5分）
    let studyMinutes = 0;
    if (questionCount > 0) {
      const measuredMs = todayAttempts.reduce((acc, a) => acc + (a.responseTimeMs || 30000), 0);
      studyMinutes = Math.max(1, Math.round(measuredMs / 60000));
    }

    // 累計
    const totalAttempts = attempts.length;
    const totalMs = attempts.reduce((acc, a) => acc + (a.responseTimeMs || 30000), 0);
    const totalMinutes = Math.max(0, Math.round(totalMs / 60000));

    return {
      questionCount,
      studyMinutes,
      accuracy,
      streakDays,
      totalAttempts,
      totalMinutes,
    };
  } catch {
    return {
      questionCount: 0,
      studyMinutes: 0,
      accuracy: 0,
      streakDays: 0,
      totalAttempts: 0,
      totalMinutes: 0,
    };
  }
}
