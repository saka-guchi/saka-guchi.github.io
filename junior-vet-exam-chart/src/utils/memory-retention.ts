import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';

const STORAGE_PREFIX = 'junior_vet_memory_retention_';

/**
 * スキルごとの記憶定着メーター値（0〜100%）を取得する
 */
export function getMemoryRetention(skillId: string): number {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${skillId}`);
    if (saved !== null) {
      const val = parseInt(saved, 10);
      if (!isNaN(val)) return Math.min(100, Math.max(0, val));
    }
  } catch {
    // ignore
  }

  // デフォルト値: THEME_ENHANCEMENTS の値、または 50%
  const defaultVal = THEME_ENHANCEMENTS[skillId]?.memoryRetention;
  return typeof defaultVal === 'number' ? defaultVal : 50;
}

/**
 * 暗記カードで正解したときに記憶定着メーターを上昇させる
 * @param skillId スキルID
 * @param boostAmount 上昇幅（デフォルト: +20%）
 * @returns 更新後の定着率 (0〜100%)
 */
export function boostMemoryRetention(skillId: string, boostAmount: number = 20): number {
  const current = getMemoryRetention(skillId);
  const next = Math.min(100, current + boostAmount);

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${skillId}`, String(next));
    // 他のコンポーネント（HomePageなど）へ変更を即時通知
    window.dispatchEvent(new CustomEvent('memory-retention-updated', { detail: { skillId, retention: next } }));
  } catch {
    // ignore
  }

  return next;
}

/**
 * 全スキルの記憶定着率マップを一括取得
 */
export function getAllMemoryRetentions(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const skillId of Object.keys(THEME_ENHANCEMENTS)) {
    map[skillId] = getMemoryRetention(skillId);
  }
  return map;
}

