/**
 * 保護者開示専用データストア (shared-store)
 * 
 * 【最重要セキュリティ規約】
 * - 本モジュールは private-store や private ストレージキーを一切 import / 参照してはならない。
 * - アクセス可能なストレージ領域は `jvet:shared:*` および `jvet:meta:parent_pin` に厳格に限定される。
 */

import {
  MENTAL_STORAGE_KEYS,
  SharedWeatherDaily,
  SharedWeeklySummary,
  SharedParentRequestMap,
  SharedCareCard,
  SharedCareSignal,
  MetaParentPin,
  WeatherType,
} from './types';
import { generateSaltHex, hashPin } from './crypto';

function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`[shared-store] Failed to read ${key}:`, e);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[shared-store] Failed to write ${key}:`, e);
  }
}

/**
 * 共有されている日別天気を取得
 * ※「今日は伝えない」を選択した日はキー自体が存在せず、記録なしと同一扱い
 */
export function getSharedWeatherMap(): SharedWeatherDaily {
  return safeGetItem<SharedWeatherDaily>(MENTAL_STORAGE_KEYS.SHARED_WEATHER_DAILY, {});
}

/**
 * 週ごとのまとめ集計を取得（お守り大分類回数、天気回数のみ）
 */
export function getSharedWeeklySummaries(): Record<string, SharedWeeklySummary> {
  return safeGetItem<Record<string, SharedWeeklySummary>>(MENTAL_STORAGE_KEYS.SHARED_WEEKLY_SUMMARY, {});
}

/**
 * お子さんからのお願い（話を聞いてほしい等）を取得
 */
export function getSharedParentRequests(): SharedParentRequestMap {
  return safeGetItem<SharedParentRequestMap>(MENTAL_STORAGE_KEYS.SHARED_PARENT_REQUESTS, {});
}

/**
 * お子さんが「おうちの人に伝える」を押して送信したカード一覧を取得
 */
export function getSharedCareCards(): SharedCareCard[] {
  return safeGetItem<SharedCareCard[]>(MENTAL_STORAGE_KEYS.SHARED_CARE_CARDS, []);
}

/**
 * 伝えるカードを削除（お子さん側または親側での整理用）
 */
export function deleteSharedCareCard(cardId: string): void {
  const cards = getSharedCareCards();
  const filtered = cards.filter((c) => c.id !== cardId);
  safeSetItem(MENTAL_STORAGE_KEYS.SHARED_CARE_CARDS, filtered);
}

/**
 * 警戒サイン（careSignal）の状態を取得
 * ※重要: 本文・単語・トピック名は一切含まず、activeフラグと日時のみ
 */
export function getSharedCareSignal(): SharedCareSignal | null {
  return safeGetItem<SharedCareSignal | null>(MENTAL_STORAGE_KEYS.SHARED_CARE_SIGNALS, null);
}

/**
 * 警戒サインが発動中かどうかを判定
 */
export function isCareSignalActive(): boolean {
  const signal = getSharedCareSignal();
  return Boolean(signal && signal.active);
}

/**
 * 保護者が警戒サインを「確認した」として解除する
 */
export function acknowledgeCareSignal(): void {
  const signal = getSharedCareSignal();
  if (signal && signal.active) {
    safeSetItem(MENTAL_STORAGE_KEYS.SHARED_CARE_SIGNALS, {
      ...signal,
      active: false,
    });
  }
}

/**
 * ------------------------------------------------------------------
 * 保護者PIN管理（PBKDF2ハッシュ認証・連続誤入力ロック）
 * ------------------------------------------------------------------
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15分

export function getParentPinMeta(): MetaParentPin | null {
  return safeGetItem<MetaParentPin | null>(MENTAL_STORAGE_KEYS.META_PARENT_PIN, null);
}

export function isParentPinSet(): boolean {
  const meta = getParentPinMeta();
  return Boolean(meta && meta.enabled && meta.testHash);
}

/**
 * 保護者PINを設定（新規設定または変更）
 */
export async function setParentPin(pin: string): Promise<void> {
  const salt = generateSaltHex(16);
  const testHash = await hashPin(pin, salt);
  const meta: MetaParentPin = {
    enabled: true,
    salt,
    testHash,
    failedCount: 0,
  };
  safeSetItem(MENTAL_STORAGE_KEYS.META_PARENT_PIN, meta);
}

export interface VerifyPinResult {
  success: boolean;
  isLocked?: boolean;
  remainingAttempts?: number;
  lockedUntil?: number;
}

/**
 * 保護者PINを検証
 */
export async function verifyParentPin(pin: string): Promise<VerifyPinResult> {
  const meta = getParentPinMeta();
  if (!meta || !meta.enabled) {
    // 未設定の場合は認証通過
    return { success: true };
  }

  const now = Date.now();
  if (meta.lockedUntil && meta.lockedUntil > now) {
    return {
      success: false,
      isLocked: true,
      lockedUntil: meta.lockedUntil,
      remainingAttempts: 0,
    };
  }

  const computedHash = await hashPin(pin, meta.salt);
  if (computedHash === meta.testHash) {
    // 認証成功: 失敗カウントをリセット
    if (meta.failedCount > 0 || meta.lockedUntil) {
      safeSetItem(MENTAL_STORAGE_KEYS.META_PARENT_PIN, {
        ...meta,
        failedCount: 0,
        lockedUntil: undefined,
      });
    }
    return { success: true };
  }

  // 認証失敗
  const newFailedCount = (meta.failedCount || 0) + 1;
  const isNowLocked = newFailedCount >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = isNowLocked ? now + LOCKOUT_DURATION_MS : undefined;

  safeSetItem(MENTAL_STORAGE_KEYS.META_PARENT_PIN, {
    ...meta,
    failedCount: isNowLocked ? 0 : newFailedCount,
    lockedUntil,
  });

  return {
    success: false,
    isLocked: isNowLocked,
    lockedUntil,
    remainingAttempts: isNowLocked ? 0 : MAX_FAILED_ATTEMPTS - newFailedCount,
  };
}

/**
 * 保護者PINの初期化（PINを忘れた場合の救済手順）
 * ※安全保障: 保護者用の shared データおよび PIN のみ初期化し、お子さんの private データには一切触れない
 */
export function resetParentPinAndSharedData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.META_PARENT_PIN);
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.SHARED_PARENT_REQUESTS);
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.SHARED_CARE_CARDS);
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.SHARED_CARE_SIGNALS);
  } catch (e) {
    console.error('[shared-store] Failed to reset parent PIN:', e);
  }
}

