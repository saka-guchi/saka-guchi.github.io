/**
 * こころ機能（こころの休憩室 / こころの見守り）データ基盤 型定義
 * 
 * 厳格な名前空間分離:
 * - jvet:private:* (子ども本人専用・暗号化可能・保護者画面からの参照不可)
 * - jvet:shared:*  (保護者開示専用・書き込み時射影・最小限データのみ)
 * - jvet:meta:*    (メタ情報・やくそく同意・PINハッシュ・スキーマ版数)
 */

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'storm';

export interface WeatherOption {
  type: WeatherType;
  label: string;
  symbol: string;
}

export const WEATHER_OPTIONS: Record<WeatherType, WeatherOption> = {
  sunny: { type: 'sunny', label: 'はれ', symbol: '☀️' },
  cloudy: { type: 'cloudy', label: 'くもり', symbol: '⛅' },
  rainy: { type: 'rainy', label: 'あめ', symbol: '🌧️' },
  storm: { type: 'storm', label: 'あらし', symbol: '⚡' },
};

/**
 * ------------------------------------------------------------------
 * Private (本人専用) データ型
 * ------------------------------------------------------------------
 */

export type SortingBoxType = 'myself' | 'help' | 'uncontrollable';

export interface PrivateSortingCard {
  id: string;
  text: string;
  box: SortingBoxType;
  nextStep?: string; // 「次の一歩」のメモ
  createdAt: string; // ISO 8601
}

export type CopingEffectLevel = 'light' | 'slight' | 'none';

export interface PrivateCopingRecord {
  copingId: string;
  memo?: string;
  lightCount: number; // 「かるくなった」回数
  history: Array<{
    date: string; // YYYY-MM-DD
    effect: CopingEffectLevel;
  }>;
}

export interface PrivatePhilosophyAnswer {
  topicId: string;
  stepChoices: Array<{
    step: number;
    choiceId?: string;
    customText?: string;
  }>;
  takeaway?: string; // 今日の気づき
  completedAt: string; // ISO 8601
}

export interface PrivateWeatherDetail {
  date: string; // YYYY-MM-DD (JST)
  weather: WeatherType;
  memo?: string;
  shareWithParent: boolean;
  parentRequest?: ParentRequestType;
  createdAt: string;
}

/**
 * ------------------------------------------------------------------
 * Shared (保護者開示専用) データ型
 * ------------------------------------------------------------------
 */

export type ParentRequestType = 'listen' | 'quiet' | 'refresh';

export const PARENT_REQUEST_LABELS: Record<ParentRequestType, string> = {
  listen: '話を聞いてほしい',
  quiet: 'そっとしておいてほしい',
  refresh: 'いっしょに気分転換したい',
};

export interface SharedWeatherDaily {
  // 日付キー: YYYY-MM-DD (JST)
  // 「今日は伝えない」選択日はキー自体が未生成（記録なしと区別不能）
  [date: string]: {
    weather: WeatherType;
    weatherLabel?: string;
    updatedAt: string;
  };
}

export type CopingCategoryKey = 'sensory' | 'body' | 'action' | 'mind' | 'distraction';

export interface SharedWeeklySummary {
  weekStart: string; // YYYY-MM-DD
  weatherCounts: Record<WeatherType, number>;
  // お守りの名称・日時は含めず、大分類カテゴリの集計のみ
  copingCategoryCounts: Record<CopingCategoryKey, number>;
  mostFrequentWeather?: WeatherType;
  totalActivities?: number;
}

export interface SharedParentRequestMap {
  [date: string]: {
    request: ParentRequestType;
    updatedAt: string;
  };
}

export interface SharedCareCard {
  id: string;
  date: string; // YYYY-MM-DD
  templateId: string;
  customText?: string;
  fromChild: true;
  createdAt: string;
  cardTitle?: string;
  sentAt?: string;
}

export interface SharedCareSignal {
  active: boolean;
  triggeredAt: string; // ISO 8601
  level: 'notice' | 'alert';
  // 重要: 本文、単語、話題名は一切含まない！
}

/**
 * ------------------------------------------------------------------
 * Meta (メタ情報) データ型
 * ------------------------------------------------------------------
 */

export interface MetaPromisesAgreed {
  version: number;
  agreedAt: string; // ISO 8601
}

export interface MetaChildLock {
  enabled: boolean;
  salt: string; // hex
  testHash: string; // hex
  iterations?: number;
}


export interface ParentAuditLogEntry {
  action: 'pin_set' | 'pin_reset' | 'care_signal_ack';
  timestamp: string; // ISO 8601
  label: string; // 日本語ラベル
  formattedDateJst: string; // YYYY/MM/DD HH:mm (JST)
}

export interface MetaParentPin {
  enabled: boolean;
  salt: string; // hex
  testHash: string; // hex
  failedCount: number;
  lockedUntil?: number; // timestamp ms
  iterations?: number;
}

/**
 * ------------------------------------------------------------------
 * Storage Keys 定数
 * ------------------------------------------------------------------
 */
export const MENTAL_STORAGE_KEYS = {
  // Private
  PRIVATE_SORTING_CARDS: 'jvet:private:sorting_cards',
  PRIVATE_COPING_RECORDS: 'jvet:private:coping_records',
  PRIVATE_PHILOSOPHY_ANSWERS: 'jvet:private:philosophy_answers',
  PRIVATE_WEATHER_DETAILS: 'jvet:private:weather_details',
  PRIVATE_ENCRYPTED_BLOB: 'jvet:private:encrypted_blob', // 暗号化有効時

  // Shared
  SHARED_WEATHER_DAILY: 'jvet:shared:weather_daily',
  SHARED_WEEKLY_SUMMARY: 'jvet:shared:weekly_summary',
  SHARED_PARENT_REQUESTS: 'jvet:shared:parent_requests',
  SHARED_CARE_CARDS: 'jvet:shared:care_cards',
  SHARED_CARE_SIGNALS: 'jvet:shared:care_signals',

  // Meta
  META_PROMISES_AGREED: 'jvet:meta:promises_agreed',
  META_CHILD_LOCK: 'jvet:meta:child_lock',
  META_PARENT_PIN: 'jvet:meta:parent_pin',
  META_PARENT_AUDIT_LOGS: 'jvet:meta:parent_audit_logs',
  META_SCHEMA_VERSION: 'jvet:meta:schema_version',

  // Backup
  BACKUP_PRE_V1_MIGRATION: 'jvet:backup:pre_v1_migration',
} as const;

