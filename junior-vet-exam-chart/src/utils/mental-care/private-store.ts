/**
 * 子ども本人専用データストア (private-store)
 * 
 * 【セキュリティ規約】
 * - 暗号鍵 (CryptoKey) はメモリ内（クロージャ変数）にのみ保持し、ストレージには一切書き込まない。
 * - 5分間の無操作、タブの非表示 (visibilitychange)、ページリロードで自動的にメモリ消去・ロック。
 * - ひみつのカギ有効時は全 private データを AES-GCM 暗号化して永続化。
 */

import {
  MENTAL_STORAGE_KEYS,
  PrivateSortingCard,
  PrivateCopingRecord,
  PrivatePhilosophyAnswer,
  PrivateWeatherDetail,
  MetaChildLock,
} from './types';
import {
  generateSaltHex,
  hashPin,
  deriveKeyFromPin,
  encryptData,
  decryptData,
  EncryptedPayload,
} from './crypto';

interface PrivateDataBundle {
  sortingCards: PrivateSortingCard[];
  copingRecords: Record<string, PrivateCopingRecord>;
  philosophyAnswers: Record<string, PrivatePhilosophyAnswer>;
  weatherDetails: Record<string, PrivateWeatherDetail>;
}

// メモリ内セッション状態（ストレージには置かない）
let memoryKey: CryptoKey | null = null;
let inactivityTimer: any = null;
const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5分

function resetInactivityTimer(): void {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    lockChild();
  }, AUTO_LOCK_TIMEOUT_MS);
}

// タブ非表示時の自動ロックリスナー
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lockChild();
    }
  });
}

/**
 * 子どものひみつのカギの設定状態を取得
 */
export function getChildLockMeta(): MetaChildLock | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(MENTAL_STORAGE_KEYS.META_CHILD_LOCK);
    if (!raw) return null;
    return JSON.parse(raw) as MetaChildLock;
  } catch (e) {
    console.error('[private-store] Failed to read child lock meta:', e);
    return null;
  }
}

export function isChildLockEnabled(): boolean {
  const meta = getChildLockMeta();
  return Boolean(meta && meta.enabled && meta.testHash);
}

export function isChildUnlocked(): boolean {
  if (!isChildLockEnabled()) return true;
  return memoryKey !== null;
}

/**
 * ひみつのカギをメモリからクリアして即座にロック
 */
export function lockChild(): void {
  memoryKey = null;
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

/**
 * 4桁PINを入力してロック解除
 */
export async function unlockChild(pin: string): Promise<boolean> {
  const meta = getChildLockMeta();
  if (!meta || !meta.enabled) {
    return true; // 設定されていなければアンロック状態
  }

  const computedHash = await hashPin(pin, meta.salt);
  if (computedHash !== meta.testHash) {
    return false;
  }

  // 暗号鍵を導出してメモリに保持
  memoryKey = await deriveKeyFromPin(pin, meta.salt);
  resetInactivityTimer();
  return true;
}

/**
 * ひみつのカギ（4桁PIN）を新規設定
 */
export async function setChildLock(pin: string): Promise<void> {
  const salt = generateSaltHex(16);
  const testHash = await hashPin(pin, salt);
  const key = await deriveKeyFromPin(pin, salt);

  // 既存の平文データをバンドルして暗号化BLOBへ移行
  const currentBundle = readUnencryptedBundle();
  const encrypted = await encryptData(currentBundle, key);

  if (typeof window !== 'undefined' && window.localStorage) {
    // 暗号化BLOBを保存
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_ENCRYPTED_BLOB,
      JSON.stringify(encrypted)
    );
    // 平文のキーを削除
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.PRIVATE_SORTING_CARDS);
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.PRIVATE_COPING_RECORDS);
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.PRIVATE_PHILOSOPHY_ANSWERS);
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.PRIVATE_WEATHER_DETAILS);

    // メタ情報を保存
    const meta: MetaChildLock = { enabled: true, salt, testHash };
    window.localStorage.setItem(MENTAL_STORAGE_KEYS.META_CHILD_LOCK, JSON.stringify(meta));
  }

  memoryKey = key;
  resetInactivityTimer();
}

/**
 * ひみつのカギを無効化（暗号化を解除して平文に戻す）
 */
export async function disableChildLock(pin: string): Promise<boolean> {
  const unlocked = await unlockChild(pin);
  if (!unlocked || !memoryKey) return false;

  const bundle = await loadPrivateBundle();

  if (typeof window !== 'undefined' && window.localStorage) {
    // 平文キーへ復帰
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_SORTING_CARDS,
      JSON.stringify(bundle.sortingCards)
    );
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_COPING_RECORDS,
      JSON.stringify(bundle.copingRecords)
    );
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_PHILOSOPHY_ANSWERS,
      JSON.stringify(bundle.philosophyAnswers)
    );
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_WEATHER_DETAILS,
      JSON.stringify(bundle.weatherDetails)
    );

    // 暗号化BLOBとロックメタを削除
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.PRIVATE_ENCRYPTED_BLOB);
    window.localStorage.removeItem(MENTAL_STORAGE_KEYS.META_CHILD_LOCK);
  }

  lockChild();
  return true;
}

// 平文の各ストレージキーから読み込み
function readUnencryptedBundle(): PrivateDataBundle {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { sortingCards: [], copingRecords: {}, philosophyAnswers: {}, weatherDetails: {} };
  }
  const parse = <T>(key: string, def: T): T => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : def;
    } catch {
      return def;
    }
  };

  return {
    sortingCards: parse<PrivateSortingCard[]>(MENTAL_STORAGE_KEYS.PRIVATE_SORTING_CARDS, []),
    copingRecords: parse<Record<string, PrivateCopingRecord>>(
      MENTAL_STORAGE_KEYS.PRIVATE_COPING_RECORDS,
      {}
    ),
    philosophyAnswers: parse<Record<string, PrivatePhilosophyAnswer>>(
      MENTAL_STORAGE_KEYS.PRIVATE_PHILOSOPHY_ANSWERS,
      {}
    ),
    weatherDetails: parse<Record<string, PrivateWeatherDetail>>(
      MENTAL_STORAGE_KEYS.PRIVATE_WEATHER_DETAILS,
      {}
    ),
  };
}

// バンドル全体の読み込み（暗号化時/平文時を自動判定）
async function loadPrivateBundle(): Promise<PrivateDataBundle> {
  if (!isChildLockEnabled()) {
    return readUnencryptedBundle();
  }

  // ロック有効時
  if (!memoryKey) {
    throw new Error('Child private store is locked. Unlock required.');
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return { sortingCards: [], copingRecords: {}, philosophyAnswers: {}, weatherDetails: {} };
  }

  const rawEnc = window.localStorage.getItem(MENTAL_STORAGE_KEYS.PRIVATE_ENCRYPTED_BLOB);
  if (!rawEnc) {
    return { sortingCards: [], copingRecords: {}, philosophyAnswers: {}, weatherDetails: {} };
  }

  try {
    const payload = JSON.parse(rawEnc) as EncryptedPayload;
    return await decryptData<PrivateDataBundle>(payload, memoryKey);
  } catch (e) {
    console.error('[private-store] Failed to decrypt private bundle:', e);
    throw new Error('Failed to decrypt private data.');
  }
}

// バンドル全体の保存（暗号化時/平文時を自動判定）
async function savePrivateBundle(bundle: PrivateDataBundle): Promise<void> {
  resetInactivityTimer();

  if (typeof window === 'undefined' || !window.localStorage) return;

  if (isChildLockEnabled()) {
    if (!memoryKey) {
      throw new Error('Child private store is locked. Unlock required.');
    }
    const encrypted = await encryptData(bundle, memoryKey);
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_ENCRYPTED_BLOB,
      JSON.stringify(encrypted)
    );
  } else {
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_SORTING_CARDS,
      JSON.stringify(bundle.sortingCards)
    );
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_COPING_RECORDS,
      JSON.stringify(bundle.copingRecords)
    );
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_PHILOSOPHY_ANSWERS,
      JSON.stringify(bundle.philosophyAnswers)
    );
    window.localStorage.setItem(
      MENTAL_STORAGE_KEYS.PRIVATE_WEATHER_DETAILS,
      JSON.stringify(bundle.weatherDetails)
    );
  }
}

/**
 * ------------------------------------------------------------------
 * Private 各種データ操作API
 * ------------------------------------------------------------------
 */

export async function getPrivateSortingCards(): Promise<PrivateSortingCard[]> {
  const bundle = await loadPrivateBundle();
  return bundle.sortingCards;
}

export async function savePrivateSortingCards(cards: PrivateSortingCard[]): Promise<void> {
  const bundle = await loadPrivateBundle();
  bundle.sortingCards = cards;
  await savePrivateBundle(bundle);
}

export async function getPrivateCopingRecords(): Promise<Record<string, PrivateCopingRecord>> {
  const bundle = await loadPrivateBundle();
  return bundle.copingRecords;
}

export async function savePrivateCopingRecords(
  records: Record<string, PrivateCopingRecord>
): Promise<void> {
  const bundle = await loadPrivateBundle();
  bundle.copingRecords = records;
  await savePrivateBundle(bundle);
}

export async function getPrivatePhilosophyAnswers(): Promise<
  Record<string, PrivatePhilosophyAnswer>
> {
  const bundle = await loadPrivateBundle();
  return bundle.philosophyAnswers;
}

export async function savePrivatePhilosophyAnswers(
  answers: Record<string, PrivatePhilosophyAnswer>
): Promise<void> {
  const bundle = await loadPrivateBundle();
  bundle.philosophyAnswers = answers;
  await savePrivateBundle(bundle);
}

export async function getPrivateWeatherDetails(): Promise<Record<string, PrivateWeatherDetail>> {
  const bundle = await loadPrivateBundle();
  return bundle.weatherDetails;
}

export async function savePrivateWeatherDetails(
  details: Record<string, PrivateWeatherDetail>
): Promise<void> {
  const bundle = await loadPrivateBundle();
  bundle.weatherDetails = details;
  await savePrivateBundle(bundle);
}

