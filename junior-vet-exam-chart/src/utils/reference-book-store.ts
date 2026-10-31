// 番外参考書クエストの学習進捗・クリア履歴管理

const STORAGE_KEY_PREFIX = 'junior_vet_refbook_';

export interface RefBookProgress {
  bookId: string;
  clearedSessionsCount: number;
  masteredIds: string[]; // 正解した人物・項目のID
  lastStudiedAt: string | null;
}

export function getRefBookProgress(bookId: string): RefBookProgress {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${bookId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    bookId,
    clearedSessionsCount: 0,
    masteredIds: [],
    lastStudiedAt: null,
  };
}

export function saveRefBookAnswer(bookId: string, itemId: string, isCorrect: boolean): RefBookProgress {
  const current = getRefBookProgress(bookId);
  const nowJst = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  current.lastStudiedAt = nowJst;

  if (isCorrect && !current.masteredIds.includes(itemId)) {
    current.masteredIds.push(itemId);
  }

  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${bookId}`, JSON.stringify(current));
  } catch {
    // ignore
  }
  return current;
}

export function recordRefBookSessionClear(bookId: string): RefBookProgress {
  const current = getRefBookProgress(bookId);
  current.clearedSessionsCount += 1;
  const nowJst = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  current.lastStudiedAt = nowJst;

  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${bookId}`, JSON.stringify(current));
  } catch {
    // ignore
  }
  return current;
}

