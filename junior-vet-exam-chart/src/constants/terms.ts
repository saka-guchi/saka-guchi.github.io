/**
 * アプリ全体で統一された機能名称・世界観用語の定義（Single Source of Truth）
 * ルール③: 対象ユーザー（小学生・児童）に合わせた用語・世界観の統制
 * 
 * 4大医療活動:
 * 1. 本日の診察 (daily_consultation)
 * 2. 知識の処方箋 (prescription)
 * 3. 症例スタディ (case_study)
 * 4. 獣医師チャレンジ (vet_challenge) ※ 旧名称「合格ドクター認定試験」「獣医師認定試験」は廃止
 */

export const APP_TERMS = {
  // 4大医療活動
  DAILY_CONSULTATION: '本日の診察',
  DAILY_CONSULTATION_WITH_ICON: '🩺 本日の診察',

  PRESCRIPTION: '知識の処方箋',
  PRESCRIPTION_WITH_ICON: '💊 知識の処方箋',

  CASE_STUDY: '症例スタディ',
  CASE_STUDY_WITH_ICON: '🐾 症例スタディ',

  VET_CHALLENGE: '獣医師チャレンジ',
  VET_CHALLENGE_WITH_ICON: '🏆 獣医師チャレンジ',

  // ゲーミフィケーション・報酬
  GENKI_POINTS: 'どうぶつ元気のもと',
  GENKI_POINTS_WITH_ICON: '🐾 どうぶつ元気のもと',
  GENKI_NOTEBOOK: 'どうぶつ元気のもと手帳',
} as const;

/**
 * 過去に使われていた廃止用語（再発防止チェック用）
 */
export const DEPRECATED_TERMS = [
  '合格ドクター認定試験',
  '獣医師認定試験',
] as const;
