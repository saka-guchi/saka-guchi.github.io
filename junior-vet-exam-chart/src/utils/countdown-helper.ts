/**
 * 日本標準時（JST: Asia/Tokyo）に基づいて指定の受験日までの残り日数を算出するヘルパー
 * CI/CDや端末タイムゾーン（UTC等）に影響されず、正確な日本時間で日付を差分計算します
 */
export function getDaysUntilExam(targetDateStr?: string | null): number {
  try {
    const validTargetStr = targetDateStr && targetDateStr.trim().length > 0
      ? targetDateStr.trim()
      : '2027-02-01';

    const jstFormatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = jstFormatter.formatToParts(new Date());
    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    const todayJst = new Date(`${p.year}-${p.month}-${p.day}T00:00:00+09:00`);
    const targetJst = new Date(`${validTargetStr}T00:00:00+09:00`);

    if (isNaN(targetJst.getTime())) {
      const defaultTarget = new Date('2027-02-01T00:00:00+09:00');
      const diffMs = defaultTarget.getTime() - todayJst.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const diffMs = targetJst.getTime() - todayJst.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  } catch {
    return 0;
  }
}

/**
 * 受験日を日本語フォーマット（例: "2027年2月1日"）に変換する
 */
export function formatExamDateJa(targetDateStr = '2027-02-01'): string {
  try {
    const [y, m, d] = targetDateStr.split('-').map(Number);
    if (!y || !m || !d) return '2027年2月1日';
    return `${y}年${m}月${d}日`;
  } catch {
    return '2027年2月1日';
  }
}

