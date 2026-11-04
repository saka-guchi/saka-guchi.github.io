/**
 * こころ機能 コアロジック (core-store)
 * 
 * 子どもの操作（チェックイン、モヤモヤ、お守り等）を受け取り、
 * private への保存と、開示ルールに基づく shared への射影（Projection）を実行。
 */

import {
  WeatherType,
  SortingBoxType,
  ParentRequestType,
  CopingEffectLevel,
  CopingCategoryKey,
  PrivateSortingCard,
  PrivateWeatherDetail,
  SharedWeatherDaily,
  SharedParentRequestMap,
  SharedWeeklySummary,
  SharedCareCard,
  SharedCareSignal,
  MENTAL_STORAGE_KEYS,
  MetaPromisesAgreed,
} from './types';
import {
  savePrivateWeatherDetails,
  getPrivateWeatherDetails,
  savePrivateSortingCards,
  getPrivateSortingCards,
  savePrivateCopingRecords,
  getPrivateCopingRecords,
} from './private-store';
import { detectCrisisInText } from './crisis-keywords';

function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[core-store] Failed to write ${key}:`, e);
  }
}

/**
 * 週開始日（月曜日）の YYYY-MM-DD を取得
 */
export function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * 直近のあらし（storm）連続状態を判定
 */
function evaluateStormAlert(detailsMap: Record<string, PrivateWeatherDetail>): boolean {
  const sortedDates = Object.keys(detailsMap).sort().reverse();
  if (sortedDates.length === 0) return false;

  // 1. 直近3日連続であらし
  let consecutiveStorms = 0;
  for (let i = 0; i < Math.min(sortedDates.length, 3); i++) {
    const detail = detailsMap[sortedDates[i]];
    if (detail && detail.weather === 'storm') {
      consecutiveStorms++;
    } else {
      break;
    }
  }
  if (consecutiveStorms >= 3) {
    return true;
  }

  // 2. 直近7日中4日以上があらし
  let stormsInPast7Days = 0;
  for (let i = 0; i < Math.min(sortedDates.length, 7); i++) {
    const detail = detailsMap[sortedDates[i]];
    if (detail && detail.weather === 'storm') {
      stormsInPast7Days++;
    }
  }
  if (stormsInPast7Days >= 4) {
    return true;
  }

  return false;
}

/**
 * 警戒サインを発動（shared にフラグと日時のみ保存）
 */
export function triggerCareSignal(level: 'notice' | 'alert' = 'alert'): void {
  const signal: SharedCareSignal = {
    active: true,
    triggeredAt: new Date().toISOString(),
    level,
  };
  safeSetItem(MENTAL_STORAGE_KEYS.SHARED_CARE_SIGNALS, signal);
}

/**
 * ------------------------------------------------------------------
 * チェックイン（心のお天気）の記録 & 射影
 * ------------------------------------------------------------------
 */

export interface RecordCheckinParams {
  date: string; // YYYY-MM-DD
  weather: WeatherType;
  memo?: string;
  shareWithParent: boolean;
  parentRequest?: ParentRequestType;
}

export async function recordMentalCheckin(params: RecordCheckinParams): Promise<{
  crisisDetected: boolean;
}> {
  const now = new Date().toISOString();

  // 1. Private に完全保存
  const details = await getPrivateWeatherDetails();
  details[params.date] = {
    date: params.date,
    weather: params.weather,
    memo: params.memo,
    shareWithParent: params.shareWithParent,
    parentRequest: params.parentRequest,
    createdAt: now,
  };
  await savePrivateWeatherDetails(details);

  // 2. Shared への射影（開示コントロール）
  const sharedWeather = safeGetItem<SharedWeatherDaily>(
    MENTAL_STORAGE_KEYS.SHARED_WEATHER_DAILY,
    {}
  );
  if (params.shareWithParent) {
    sharedWeather[params.date] = {
      weather: params.weather,
      updatedAt: now,
    };
  } else {
    // 「今日は伝えない」場合はキー自体を削除（未記録と区別不能化）
    delete sharedWeather[params.date];
  }
  safeSetItem(MENTAL_STORAGE_KEYS.SHARED_WEATHER_DAILY, sharedWeather);

  // 親へのお願いがある場合
  if (params.parentRequest) {
    const parentRequests = safeGetItem<SharedParentRequestMap>(
      MENTAL_STORAGE_KEYS.SHARED_PARENT_REQUESTS,
      {}
    );
    parentRequests[params.date] = {
      request: params.parentRequest,
      updatedAt: now,
    };
    safeSetItem(MENTAL_STORAGE_KEYS.SHARED_PARENT_REQUESTS, parentRequests);
  }

  // 3. 週サマリー（天気回数）の更新
  const weekMonday = getMondayOfWeek(params.date);
  const weeklySummaries = safeGetItem<Record<string, SharedWeeklySummary>>(
    MENTAL_STORAGE_KEYS.SHARED_WEEKLY_SUMMARY,
    {}
  );
  if (!weeklySummaries[weekMonday]) {
    weeklySummaries[weekMonday] = {
      weekStart: weekMonday,
      weatherCounts: { sunny: 0, cloudy: 0, rainy: 0, storm: 0 },
      copingCategoryCounts: { sensory: 0, body: 0, action: 0, mind: 0, distraction: 0 },
    };
  }
  if (params.shareWithParent) {
    weeklySummaries[weekMonday].weatherCounts[params.weather] =
      (weeklySummaries[weekMonday].weatherCounts[params.weather] || 0) + 1;
    safeSetItem(MENTAL_STORAGE_KEYS.SHARED_WEEKLY_SUMMARY, weeklySummaries);
  }

  // 4. 警戒サイン判定（テキスト危機語句 or あらし連続）
  let crisisDetected = false;
  if (detectCrisisInText(params.memo)) {
    crisisDetected = true;
    triggerCareSignal('alert');
  } else if (evaluateStormAlert(details)) {
    triggerCareSignal('alert');
  }

  return { crisisDetected };
}

/**
 * ------------------------------------------------------------------
 * お守りコーピング効果の記録 & カテゴリ射影
 * ------------------------------------------------------------------
 */

export interface RecordCopingEffectParams {
  copingId: string;
  category: CopingCategoryKey;
  effect: CopingEffectLevel;
  date?: string; // YYYY-MM-DD
  memo?: string;
}

export async function recordCopingEffect(params: RecordCopingEffectParams): Promise<void> {
  const dateStr = params.date || new Date().toISOString().split('T')[0];

  // 1. Private に詳細記録
  const records = await getPrivateCopingRecords();
  const current = records[params.copingId] || {
    copingId: params.copingId,
    lightCount: 0,
    history: [],
  };

  current.history.push({
    date: dateStr,
    effect: params.effect,
  });
  if (params.effect === 'light') {
    current.lightCount += 1;
  }
  if (params.memo) {
    current.memo = params.memo;
  }
  records[params.copingId] = current;
  await savePrivateCopingRecords(records);

  // 2. Shared には「カテゴリ集計」のみ射影（お守り名称や日時は一切渡さない）
  if (params.effect === 'light') {
    const weekMonday = getMondayOfWeek(dateStr);
    const weeklySummaries = safeGetItem<Record<string, SharedWeeklySummary>>(
      MENTAL_STORAGE_KEYS.SHARED_WEEKLY_SUMMARY,
      {}
    );
    if (!weeklySummaries[weekMonday]) {
      weeklySummaries[weekMonday] = {
        weekStart: weekMonday,
        weatherCounts: { sunny: 0, cloudy: 0, rainy: 0, storm: 0 },
        copingCategoryCounts: { sensory: 0, body: 0, action: 0, mind: 0, distraction: 0 },
      };
    }
    weeklySummaries[weekMonday].copingCategoryCounts[params.category] =
      (weeklySummaries[weekMonday].copingCategoryCounts[params.category] || 0) + 1;
    safeSetItem(MENTAL_STORAGE_KEYS.SHARED_WEEKLY_SUMMARY, weeklySummaries);
  }
}

/**
 * ------------------------------------------------------------------
 * モヤモヤ仕分けカードの追加・更新
 * ------------------------------------------------------------------
 */


/**
 * モヤモヤ仕分けカードの削除（キャンセル・取り消し）
 */
export async function deleteSortingCard(cardId: string): Promise<void> {
  const cards = await getPrivateSortingCards();
  const filtered = cards.filter((c) => c.id !== cardId);
  await savePrivateSortingCards(filtered);
}

/**
 * モヤモヤ仕分けカードの箱移動
 */
export async function moveSortingCard(
  cardId: string,
  newBox: SortingBoxType
): Promise<void> {
  const cards = await getPrivateSortingCards();
  const updated = cards.map((c) => (c.id === cardId ? { ...c, box: newBox } : c));
  await savePrivateSortingCards(updated);
}

export async function addSortingCard(
  card: Omit<PrivateSortingCard, 'id' | 'createdAt'>
): Promise<{ card: PrivateSortingCard; crisisDetected: boolean }> {
  const newCard: PrivateSortingCard = {
    ...card,
    id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const cards = await getPrivateSortingCards();
  cards.unshift(newCard);
  await savePrivateSortingCards(cards);

  let crisisDetected = false;
  if (detectCrisisInText(newCard.text) || detectCrisisInText(newCard.nextStep)) {
    crisisDetected = true;
    triggerCareSignal('alert');
  }

  return { card: newCard, crisisDetected };
}

/**
 * ------------------------------------------------------------------
 * 伝えるカードの送信（子どもが「おうちの人に伝える」を押した時のみ）
 * ------------------------------------------------------------------
 */

export function sendCareCardToParent(templateId: string, customText?: string): SharedCareCard {
  const cards = safeGetItem<SharedCareCard[]>(MENTAL_STORAGE_KEYS.SHARED_CARE_CARDS, []);
  const newCard: SharedCareCard = {
    id: `care_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toISOString().split('T')[0],
    templateId,
    customText,
    fromChild: true,
    createdAt: new Date().toISOString(),
  };
  cards.unshift(newCard);
  safeSetItem(MENTAL_STORAGE_KEYS.SHARED_CARE_CARDS, cards);
  return newCard;
}

/**
 * ------------------------------------------------------------------
 * 3つのやくそく同意管理
 * ------------------------------------------------------------------
 */

export function getPromisesAgreedMeta(): MetaPromisesAgreed | null {
  return safeGetItem<MetaPromisesAgreed | null>(MENTAL_STORAGE_KEYS.META_PROMISES_AGREED, null);
}

export function agreeToPromises(): void {
  const meta: MetaPromisesAgreed = {
    version: 1,
    agreedAt: new Date().toISOString(),
  };
  safeSetItem(MENTAL_STORAGE_KEYS.META_PROMISES_AGREED, meta);
}

