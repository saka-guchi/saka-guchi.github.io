/**
 * 既存こころデータ移行スクリプト (migration)
 * 
 * 旧キー (junior_vet_mental_*) から新名前空間 (jvet:private:*, jvet:shared:*, jvet:meta:*) への安全な移行。
 * - バックアップ作成 (jvet:backup:pre_v1_migration)
 * - 既存のセンシティブ自由記述を保護者開示領域から完全に排除
 * - 破損JSON安全フォールバック
 */

import {
  MENTAL_STORAGE_KEYS,
  PrivateSortingCard,
  PrivateCopingRecord,
  PrivatePhilosophyAnswer,
  PrivateWeatherDetail,
  SharedWeatherDaily,
  WeatherType,
} from './types';

const LEGACY_KEYS = {
  SAVED_COPINGS: 'junior_vet_mental_saved_copings',
  CUSTOM_SORT_CARDS: 'junior_vet_mental_custom_sort_cards',
  COMPLETED_TOPICS: 'junior_vet_mental_completed_topics',
  TODAY_CHECKIN: 'junior_vet_mental_today_checkin',
  PARENT_CHECKLIST: 'junior_vet_parent_action_checklist',
} as const;

export interface MigrationResult {
  migrated: boolean;
  backupCreated: boolean;
  counts: {
    sortingCards: number;
    copingRecords: number;
    philosophyAnswers: number;
    weatherDetails: number;
  };
}

export function runMentalCareMigration(): MigrationResult {
  const result: MigrationResult = {
    migrated: false,
    backupCreated: false,
    counts: { sortingCards: 0, copingRecords: 0, philosophyAnswers: 0, weatherDetails: 0 },
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return result;
  }

  try {
    // 1. スキーマ版数チェック
    const versionStr = window.localStorage.getItem(MENTAL_STORAGE_KEYS.META_SCHEMA_VERSION);
    if (versionStr && parseInt(versionStr, 10) >= 1) {
      return result; // すでに移行済み
    }

    // 2. 旧データのスナップショット退避
    const backup: Record<string, string | null> = {};
    let hasLegacyData = false;

    for (const key of Object.values(LEGACY_KEYS)) {
      const val = window.localStorage.getItem(key);
      if (val !== null) {
        backup[key] = val;
        hasLegacyData = true;
      }
    }

    if (hasLegacyData) {
      window.localStorage.setItem(
        MENTAL_STORAGE_KEYS.BACKUP_PRE_V1_MIGRATION,
        JSON.stringify(backup)
      );
      result.backupCreated = true;
    }

    // 3. 各旧データの変換と新ストレージへの書き込み
    // (a) 自作モヤモヤ仕分けカード -> private:sorting_cards
    const legacyCardsRaw = backup[LEGACY_KEYS.CUSTOM_SORT_CARDS];
    if (legacyCardsRaw) {
      try {
        const legacyCards = JSON.parse(legacyCardsRaw);
        if (Array.isArray(legacyCards)) {
          const migratedCards: PrivateSortingCard[] = legacyCards.map((c: any, index: number) => ({
            id: c.id || `migrated_card_${index}`,
            text: c.text || '',
            box: c.box === 'own' ? 'myself' : 'uncontrollable',
            createdAt: c.createdAt || new Date().toISOString(),
          }));
          window.localStorage.setItem(
            MENTAL_STORAGE_KEYS.PRIVATE_SORTING_CARDS,
            JSON.stringify(migratedCards)
          );
          result.counts.sortingCards = migratedCards.length;
        }
      } catch (e) {
        console.warn('[migration] Failed to parse legacy sorting cards:', e);
      }
    }

    // (b) お守りID配列 -> private:coping_records
    const legacyCopingsRaw = backup[LEGACY_KEYS.SAVED_COPINGS];
    if (legacyCopingsRaw) {
      try {
        const legacyCopings = JSON.parse(legacyCopingsRaw);
        if (Array.isArray(legacyCopings)) {
          const copingRecords: Record<string, PrivateCopingRecord> = {};
          legacyCopings.forEach((id: string) => {
            copingRecords[id] = {
              copingId: id,
              lightCount: 1, // 既存のお守りは1回記録相当
              history: [{ date: new Date().toISOString().split('T')[0], effect: 'light' }],
            };
          });
          window.localStorage.setItem(
            MENTAL_STORAGE_KEYS.PRIVATE_COPING_RECORDS,
            JSON.stringify(copingRecords)
          );
          result.counts.copingRecords = Object.keys(copingRecords).length;
        }
      } catch (e) {
        console.warn('[migration] Failed to parse legacy copings:', e);
      }
    }

    // (c) 完了哲学対話トピック -> private:philosophy_answers
    const legacyTopicsRaw = backup[LEGACY_KEYS.COMPLETED_TOPICS];
    if (legacyTopicsRaw) {
      try {
        const legacyTopics = JSON.parse(legacyTopicsRaw);
        if (Array.isArray(legacyTopics)) {
          const philosophyAnswers: Record<string, PrivatePhilosophyAnswer> = {};
          legacyTopics.forEach((topicId: string) => {
            philosophyAnswers[topicId] = {
              topicId,
              stepChoices: [],
              completedAt: new Date().toISOString(),
            };
          });
          window.localStorage.setItem(
            MENTAL_STORAGE_KEYS.PRIVATE_PHILOSOPHY_ANSWERS,
            JSON.stringify(philosophyAnswers)
          );
          result.counts.philosophyAnswers = Object.keys(philosophyAnswers).length;
        }
      } catch (e) {
        console.warn('[migration] Failed to parse legacy topics:', e);
      }
    }

    // (d) チェックイン -> private:weather_details & shared:weather_daily
    const legacyCheckinRaw = backup[LEGACY_KEYS.TODAY_CHECKIN];
    if (legacyCheckinRaw) {
      try {
        const legacyCheckin = JSON.parse(legacyCheckinRaw);
        if (legacyCheckin && legacyCheckin.weather) {
          const date = legacyCheckin.date || new Date().toISOString().split('T')[0];
          const weather: WeatherType = legacyCheckin.weather;

          // Private にメモ含む詳細
          const details: Record<string, PrivateWeatherDetail> = {
            [date]: {
              date,
              weather,
              memo: legacyCheckin.memo || undefined,
              shareWithParent: true,
              createdAt: new Date().toISOString(),
            },
          };
          window.localStorage.setItem(
            MENTAL_STORAGE_KEYS.PRIVATE_WEATHER_DETAILS,
            JSON.stringify(details)
          );
          result.counts.weatherDetails = 1;

          // Shared には天気記号のみ射影
          const shared: SharedWeatherDaily = {
            [date]: {
              weather,
              updatedAt: new Date().toISOString(),
            },
          };
          window.localStorage.setItem(
            MENTAL_STORAGE_KEYS.SHARED_WEATHER_DAILY,
            JSON.stringify(shared)
          );
        }
      } catch (e) {
        console.warn('[migration] Failed to parse legacy checkin:', e);
      }
    }

    // 4. スキーマ版数を記録
    window.localStorage.setItem(MENTAL_STORAGE_KEYS.META_SCHEMA_VERSION, '1');
    result.migrated = true;
  } catch (err) {
    console.error('[migration] Migration encountered an error:', err);
  }

  return result;
}

