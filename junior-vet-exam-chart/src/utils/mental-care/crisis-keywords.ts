/**
 * こころ機能 セーフティネット判定（警戒サイン・危機検知）
 * 
 * 完全端末内（ローカル）完結のルールベース検知。
 * 外部送信、AI呼び出し、サーバーログ等は一切発生しません。
 */

/**
 * 深刻な危機（自傷・希死念慮・暴力・深刻ないじめ等）の検知パターン
 */
const CRISIS_PATTERNS: RegExp[] = [
  // 希死念慮・消滅願望
  /(?:死にたい|しにたい|消えたい|きえたい|消えてしまいたい|いなくなりたい|生きて(たくない|てても)|生きるのがつらい|終わりにしたい)/i,
  // 自傷・自傷行為
  /(?:自分を傷|じぶんをきず|リストカット|リスカ|手首切|飛び降|首吊|飛びこみ|オーバードーズ|OD|薬.*(大量|いっぱい))/i,
  // 暴力・虐待
  /(?:殴られ|なぐられ|蹴られ|けられ|叩かれ|たたかれ|暴力を振る|閉じ込められ|ご飯.*(もらえない|くれない)|首を絞)/i,
  // 深刻ないじめ・脅迫
  /(?:いじめられて|金.*(取られ|出せ|払え)|死ねと言|殺すと言|脅され|ネットに(さらされ|晒され)|写真.*ばらま)/i,
];

/**
 * テキスト内に深刻な危機のキーワードが含まれているかを判定
 * @param text 判定対象テキスト（自由記述メモ、モヤモヤカード等）
 * @returns 危機パターンに合致した場合は true
 */
export function detectCrisisInText(text: string | undefined | null): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const normalized = text.trim();
  if (normalized.length === 0) {
    return false;
  }

  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * 外部の公的相談窓口情報（最新確認済み公式データ）
 */
export interface CrisisSupportContact {
  name: string;
  phone: string;
  hours: string;
  description: string;
  isFreeCall: boolean;
}

export const OFFICIAL_CRISIS_CONTACTS: CrisisSupportContact[] = [
  {
    name: '文部科学省 24時間子供SOSダイヤル',
    phone: '0120-0-78310',
    hours: '24時間 年中無休',
    description: 'いじめや人間関係、学校のことなど、どんな悩みでも24時間いつでも話せます。',
    isFreeCall: true,
  },
  {
    name: 'チャイルドライン',
    phone: '0120-99-7777',
    hours: '毎日 16:00〜21:00',
    description: '18才までの子どもがかける専用の電話です。話したいこと、何でも話せます。',
    isFreeCall: true,
  },
  {
    name: '法務省 こどもの人権110番',
    phone: '0120-007-110',
    hours: '平日 8:30〜17:15',
    description: 'いじめや体罰など、人権に関わる困りごとを相談できます。',
    isFreeCall: true,
  },
];
