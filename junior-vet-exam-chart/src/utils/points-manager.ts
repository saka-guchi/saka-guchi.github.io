import { getJstDateString } from './progress-analytics';

export interface VetRank {
  rankLevel: number;
  title: string;
  badge: string;
  minPoints: number;
  description: string;
  storyChapter: string; // 獣医師ストーリーの章タイトル
  storyExcerpt: string; // 獣医師ストーリーの物語テキスト
}

export const VET_RANKS: VetRank[] = [
  {
    rankLevel: 1,
    title: 'たまご獣医',
    badge: '🌱',
    minPoints: 0,
    description: '最初の一歩！カルテの読み方を勉強中のみならい獣医さん。',
    storyChapter: '第1章: どうぶつ病院へようこそ',
    storyExcerpt: 'クリニックの白衣を着て、ナース猫ミケちゃんと出会いました。動物カルテを開いて、最初の一歩を踏み出します！',
  },
  {
    rankLevel: 2,
    title: 'みならい獣医',
    badge: '🐾',
    minPoints: 30,
    description: '動物たちと心を通わせ、かんたんな診察や処方ができるようになったよ！',
    storyChapter: '第2章: 心を通わせる聴診器',
    storyExcerpt: '動物たちの小さな声が聞こえるようになってきました。急所を見抜き、元気を届ける喜びを知ったみならい先生です。',
  },
  {
    rankLevel: 3,
    title: 'じゅん獣医師',
    badge: '🩺',
    minPoints: 100,
    description: '100以上の知識をマスター！動物の痛みをしっかり見抜いて的確に処方できる。',
    storyChapter: '第3章: 頼れる処方せん',
    storyExcerpt: '難しい症例も粘り強く分析。名作参考書の知識やカルテの急所を活用し、たくさんの動物たちを元気に回復させています。',
  },
  {
    rankLevel: 4,
    title: '一人前獣医師',
    badge: '⭐',
    minPoints: 200,
    description: '頼れる動物ドクター！たくさんの動物たちを笑顔にしてきた確かな証。',
    storyChapter: '第4章: 森の動物病院の主治医',
    storyExcerpt: '町中の動物たちから「先生、ありがとう！」と信頼される一人前ドクターに成長！難問症例にもひるまず立ち向かいます。',
  },
  {
    rankLevel: 5,
    title: 'ベテラン獣医師',
    badge: '👑',
    minPoints: 400,
    description: 'みんなの町の守り神！難関校の過去問本番試験もスパッと見抜く高い診察力。',
    storyChapter: '第5章: 奇跡を起こす名ドクター',
    storyExcerpt: '数々の難関症例を制覇し、認定試験でも圧倒的な実力を発揮。動物医療の未来を背負う、みんなの誇り高き守り神です。',
  },
  {
    rankLevel: 6,
    title: '名医ゴールド獣医師',
    badge: '🏆',
    minPoints: 800,
    description: '伝説のマスター獣医師！中学入試の全急所を極めし最高峰の称号。',
    storyChapter: '最終章: 黄金のライセンス',
    storyExcerpt: '全教科・全症例を完全克服し、伝説のゴールドドクターライセンスを戴冠！動物たちの笑顔と中学入試合格を掴み取りました！',
  },
];

export type PointsSource = 'daily_exam' | 'prescription' | 'case_study' | 'vet_challenge';

export interface PointsSourceDetail {
  id: PointsSource;
  title: string;
  icon: string;
  shortDesc: string;
}

export const POINTS_SOURCES: Record<PointsSource, PointsSourceDetail> = {
  daily_exam: {
    id: 'daily_exam',
    title: '本日の診察',
    icon: '🩺',
    shortDesc: '毎日の10問診察で元気を届ける',
  },
  prescription: {
    id: 'prescription',
    title: '知識の処方箋',
    icon: '💊',
    shortDesc: '名作参考書で重要知識を処方',
  },
  case_study: {
    id: 'case_study',
    title: '症例スタディ',
    icon: '📋',
    shortDesc: 'カルテ特訓と全快テーママスター',
  },
  vet_challenge: {
    id: 'vet_challenge',
    title: '獣医師チャレンジ',
    icon: '👑',
    shortDesc: '過去問本番の認定試験を突破',
  },
};

const TOTAL_POINTS_KEY = 'junior_vet_points_total';
const DAILY_POINTS_KEY = 'junior_vet_points_daily';
const BY_SOURCE_KEY = 'junior_vet_points_by_source';

export interface DailyPointsMap {
  [dateJst: string]: number;
}

export interface PointsBySourceMap {
  daily_exam: number;
  prescription: number;
  case_study: number;
  vet_challenge: number;
}

export interface PointsSummary {
  todayPoints: number;
  totalPoints: number;
  bySource: PointsBySourceMap;
  currentRank: VetRank;
  nextRank: VetRank | null;
  pointsToNextRank: number;
  rankProgressPercent: number; // 0 to 100
}

/**
 * 累計元気のもと数を取得する
 */
export function getTotalPoints(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    const saved = localStorage.getItem(TOTAL_POINTS_KEY);
    return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

/**
 * 日別獲得元気のもとマップを取得する
 */
export function getDailyPointsMap(): DailyPointsMap {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const saved = localStorage.getItem(DAILY_POINTS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

/**
 * 学習分野別の獲得元気のもとマップを取得する
 */
export function getPointsBySourceMap(): PointsBySourceMap {
  const defaultMap: PointsBySourceMap = {
    daily_exam: 0,
    prescription: 0,
    case_study: 0,
    vet_challenge: 0,
  };
  if (typeof window === 'undefined' || !window.localStorage) return defaultMap;
  try {
    const saved = localStorage.getItem(BY_SOURCE_KEY);
    if (!saved) return defaultMap;
    const parsed = JSON.parse(saved);
    return {
      daily_exam: Math.max(0, parseInt(parsed.daily_exam, 10) || 0),
      prescription: Math.max(0, parseInt(parsed.prescription, 10) || 0),
      case_study: Math.max(0, parseInt(parsed.case_study, 10) || 0),
      vet_challenge: Math.max(0, parseInt(parsed.vet_challenge, 10) || 0),
    };
  } catch {
    return defaultMap;
  }
}

/**
 * 今日（JST）獲得した元気のもと数を取得する
 */
export function getTodayPoints(todayJstStr?: string): number {
  const map = getDailyPointsMap();
  const today = todayJstStr || getJstDateString(new Date());
  return map[today] || 0;
}

/**
 * 累計ポイントから現在の獣医師ランクを算出する
 */
export function getVetRank(totalPoints: number): VetRank {
  for (let i = VET_RANKS.length - 1; i >= 0; i--) {
    if (totalPoints >= VET_RANKS[i].minPoints) {
      return VET_RANKS[i];
    }
  }
  return VET_RANKS[0];
}

/**
 * ポイントサマリー（今日、累計、分野別内訳、ランク進捗）を取得する
 */
export function getPointsSummary(todayJstStr?: string): PointsSummary {
  const totalPoints = getTotalPoints();
  const todayPoints = getTodayPoints(todayJstStr);
  const bySource = getPointsBySourceMap();
  const currentRank = getVetRank(totalPoints);

  const currentRankIndex = VET_RANKS.findIndex(r => r.rankLevel === currentRank.rankLevel);
  const nextRank = currentRankIndex < VET_RANKS.length - 1 ? VET_RANKS[currentRankIndex + 1] : null;

  let pointsToNextRank = 0;
  let rankProgressPercent = 100;

  if (nextRank) {
    pointsToNextRank = Math.max(0, nextRank.minPoints - totalPoints);
    const range = nextRank.minPoints - currentRank.minPoints;
    const currentProgress = totalPoints - currentRank.minPoints;
    rankProgressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100))) : 100;
  }

  return {
    todayPoints,
    totalPoints,
    bySource,
    currentRank,
    nextRank,
    pointsToNextRank,
    rankProgressPercent,
  };
}

export interface AwardPointsResult {
  addedPoints: number;
  source: PointsSource;
  newTodayPoints: number;
  newTotalPoints: number;
  newBySource: PointsBySourceMap;
  prevRank: VetRank;
  newRank: VetRank;
  isRankUp: boolean;
}

/**
 * 学習完了時に元気のもとを付与する（4大医療活動すべてに対応）
 * @param amount 付与する元気のもと数
 * @param source 活動分野 ('daily_exam' | 'prescription' | 'case_study' | 'vet_challenge')
 * @param date JST基準日（省略時は現在日時）
 */
export function awardSessionPoints(
  amount: number,
  source: PointsSource = 'daily_exam',
  date: Date = new Date()
): AwardPointsResult {
  const addedPoints = Math.max(0, Math.floor(amount));
  const prevTotal = getTotalPoints();
  const prevRank = getVetRank(prevTotal);
  const bySource = getPointsBySourceMap();

  if (addedPoints <= 0) {
    const todayPoints = getTodayPoints();
    return {
      addedPoints: 0,
      source,
      newTodayPoints: todayPoints,
      newTotalPoints: prevTotal,
      newBySource: bySource,
      prevRank,
      newRank: prevRank,
      isRankUp: false,
    };
  }

  const newTotal = prevTotal + addedPoints;
  const todayJst = getJstDateString(date);
  const dailyMap = getDailyPointsMap();
  const newToday = (dailyMap[todayJst] || 0) + addedPoints;
  dailyMap[todayJst] = newToday;

  bySource[source] = (bySource[source] || 0) + addedPoints;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(TOTAL_POINTS_KEY, String(newTotal));
      localStorage.setItem(DAILY_POINTS_KEY, JSON.stringify(dailyMap));
      localStorage.setItem(BY_SOURCE_KEY, JSON.stringify(bySource));
    } catch {
      // ignore
    }

    // 他コンポーネント（HomePageなど）への同期イベント発火
    window.dispatchEvent(
      new CustomEvent('junior-vet-points-updated', {
        detail: {
          addedPoints,
          source,
          newTodayPoints: newToday,
          newTotalPoints: newTotal,
          newBySource: bySource,
        },
      })
    );
  }

  const newRank = getVetRank(newTotal);
  const isRankUp = newRank.rankLevel > prevRank.rankLevel;

  return {
    addedPoints,
    source,
    newTodayPoints: newToday,
    newTotalPoints: newTotal,
    newBySource: bySource,
    prevRank,
    newRank,
    isRankUp,
  };
}
