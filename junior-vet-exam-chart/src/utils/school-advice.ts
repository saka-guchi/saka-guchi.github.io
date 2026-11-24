import { SCHOOL_ADVICE_DATA, type SchoolId, type AdviceItem, type SchoolAdviceData } from '../data/school-advice-data';

const STORAGE_PREFIX = 'jvet:school-advice-checks:';

/**
 * 日本標準時（JST）の今日の日付文字列 (YYYY-MM-DD) を取得
 */
export function getTodayJstDate(): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\//g, '-');
}

/**
 * 今日のチェック済みアイテムIDのSetを取得
 */
export function getTodayCheckedItemIds(): Set<string> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return new Set();
  }
  const dateStr = getTodayJstDate();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${dateStr}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch (e) {
    console.warn('Failed to parse school advice checks:', e);
    return new Set();
  }
}

/**
 * アイテムのチェック状態をトグル
 */
export function toggleAdviceItemCheck(itemId: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  const dateStr = getTodayJstDate();
  const set = getTodayCheckedItemIds();
  const willCheck = !set.has(itemId);

  if (willCheck) {
    set.add(itemId);
  } else {
    set.delete(itemId);
  }

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${dateStr}`, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent('school-advice-updated', { detail: { date: dateStr, checkedCount: set.size } }));
  } catch (e) {
    console.warn('Failed to save school advice check:', e);
  }

  return willCheck;
}

/**
 * 今日の全チェックをリセット
 */
export function resetTodayChecks(schoolId?: SchoolId): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const dateStr = getTodayJstDate();
  if (!schoolId) {
    localStorage.removeItem(`${STORAGE_PREFIX}${dateStr}`);
  } else {
    const school = SCHOOL_ADVICE_DATA[schoolId];
    const allSchoolIds = new Set(getAllItemIdsForSchool(school));
    const set = getTodayCheckedItemIds();
    for (const id of allSchoolIds) {
      set.delete(id);
    }
    localStorage.setItem(`${STORAGE_PREFIX}${dateStr}`, JSON.stringify(Array.from(set)));
  }
  window.dispatchEvent(new CustomEvent('school-advice-updated', { detail: { date: dateStr } }));
}

/**
 * 特定の学校に含まれる全アイテムIDを取得
 */
export function getAllItemIdsForSchool(school: SchoolAdviceData): string[] {
  const ids: string[] = [];
  for (const sec of school.sections) {
    if (sec.directItems) {
      for (const item of sec.directItems) {
        ids.push(item.id);
      }
    }
    if (sec.subSections) {
      for (const sub of sec.subSections) {
        for (const item of sub.items) {
          ids.push(item.id);
        }
      }
    }
  }
  return ids;
}

/**
 * 学校ごとのチェック済み個数と全個数を取得
 */
export function getSchoolCompletionStats(schoolId: SchoolId): { checked: number; total: number; percent: number } {
  const school = SCHOOL_ADVICE_DATA[schoolId];
  if (!school) return { checked: 0, total: 0, percent: 0 };
  const allIds = getAllItemIdsForSchool(school);
  const checkedSet = getTodayCheckedItemIds();
  const checkedCount = allIds.filter(id => checkedSet.has(id)).length;
  const total = allIds.length;
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  return { checked: checkedCount, total, percent };
}

/**
 * 全学校に含まれるすべてのアドバイスアイテムをリスト化（ホーム画面の日替わり選出用）
 */
export interface HighlightAdviceItem {
  schoolId: SchoolId;
  schoolName: string;
  hospitalName: string;
  sectionTitle: string;
  doctorTitle: string;
  doctorAvatar: string;
  item: AdviceItem;
}

export function getAllAdviceItemsFlat(): HighlightAdviceItem[] {
  const list: HighlightAdviceItem[] = [];
  const schools: SchoolId[] = ['chiyoda', 'meguro'];

  for (const sId of schools) {
    const school = SCHOOL_ADVICE_DATA[sId];
    for (const sec of school.sections) {
      if (sec.directItems) {
        for (const item of sec.directItems) {
          list.push({
            schoolId: sId,
            schoolName: school.schoolName,
            hospitalName: school.hospitalName,
            sectionTitle: sec.title,
            doctorTitle: sec.doctorTitle,
            doctorAvatar: sec.doctorAvatar,
            item,
          });
        }
      }
      if (sec.subSections) {
        for (const sub of sec.subSections) {
          for (const item of sub.items) {
            list.push({
              schoolId: sId,
              schoolName: school.schoolName,
              hospitalName: school.hospitalName,
              sectionTitle: `${sec.title} - ${sub.title}`,
              doctorTitle: sec.doctorTitle,
              doctorAvatar: sec.doctorAvatar,
              item,
            });
          }
        }
      }
    }
  }
  return list;
}

/**
 * 日付（JST）に基づいた決定論的ピックアップアドバイスを取得
 */
export function getDailyPickupAdvice(dateStr = getTodayJstDate(), offset = 0): HighlightAdviceItem {
  const all = getAllAdviceItemsFlat();
  if (all.length === 0) {
    throw new Error('No advice items found');
  }
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash + offset) % all.length;
  return all[index];
}
