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
    title: '見学生',
    badge: '🌱',
    minPoints: 0,
    description: '最初の一歩！森の動物病院で院長先生とナース猫ミケちゃんに出会った見学生さん。',
    storyChapter: '第1章: 森の動物病院へようこそ',
    storyExcerpt: '森の動物病院の扉を開けると、白衣を着た院長先生と元気なナース猫ミケちゃんが出迎えてくれました。「ようこそ！今日からいっしょに、森の動物たちを元気にしていこうね！」',
  },
  {
    rankLevel: 2,
    title: '研修医',
    badge: '🐾',
    minPoints: 30,
    description: '院長先生から聴診器を授かり、初めて動物たちの小さな心音を聞いた研修医の先生！',
    storyChapter: '第2章: はじめての聴診器',
    storyExcerpt: '院長先生からキラリと光る聴診器を手渡されました。ミケちゃんが連れてきた子ジカの胸にあてると、トクトクと力強い命の音が聞こえてきます。「先生、聞こえたニャ？これが動物たちの生きている声だニャ！」',
  },
  {
    rankLevel: 3,
    title: '新人獣医師',
    badge: '🩺',
    minPoints: 100,
    description: '知識を深めて自分で薬を処方し、動物たちを笑顔で元気にした新人ドクター！',
    storyChapter: '第3章: はじめての処方せん',
    storyExcerpt: '熱を出したウサギさんのために、学んだ知識をフル活用してはじめての処方せんを書きました。お薬を飲んだウサギさんはぴょんぴょんと元気に！「先生の的確な処方のおかげじゃな」と院長先生もにっこり。',
  },
  {
    rankLevel: 4,
    title: '一人前の獣医師',
    badge: '⭐',
    minPoints: 200,
    description: '嵐の夜の急患にも一人で立ち向かい、見事ピンチを救った頼れる一人前ドクター！',
    storyChapter: '第4章: 夜の急患',
    storyExcerpt: '強い嵐の夜、院長先生が往診で留守の病院に急患のキツネさんがやってきました。ミケちゃんと力を合わせ、落ち着いて処置を行い見事にピンチを救いました。「もう一人前だな、立派な主治医だ」と院長先生に認められました。',
  },
  {
    rankLevel: 5,
    title: '副院長',
    badge: '👑',
    minPoints: 400,
    description: '遠くの森からも動物たちが頼ってやってくる、信頼度抜群の頼もしい副院長先生！',
    storyChapter: '第5章: 森じゅうの動物たち',
    storyExcerpt: '先生の評判は広まり、遠くの森からもたくさんの動物たちが頼ってやってくるようになりました。「副院長先生、診てください！」と動物たちに囲まれる姿に、ミケちゃんも誇らしげです。病院になくてはならない大黒柱になりました。',
  },
  {
    rankLevel: 6,
    title: '院長',
    badge: '🏆',
    minPoints: 800,
    description: '院長先生から森の動物病院を引き継ぎ、みんなの未来を背負う立派な新院長先生！',
    storyChapter: '最終章: 病院をまかされる日',
    storyExcerpt: 'すべての困難を乗り越え、院長先生から病院の鍵とカルテが託されました。「この森の動物病院を、次の院長である君にまかせたい」。ミケちゃんや森じゅうの動物たちの拍手の中、新しい院長先生としての歩みが始まりました！',
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
