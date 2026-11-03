import type { SampleQuestion } from '../data/sample-data';
import type { Subject } from '../types';

/**
 * 教科コードを親しみやすい日本語表記に変換する
 */
export function getSubjectJaName(subject?: Subject | string): string {
  switch (subject) {
    case 'kokugo':
      return '国語';
    case 'sansu':
      return '算数';
    case 'rika':
      return '理科';
    case 'shakai':
      return '社会';
    default:
      return '';
  }
}

/**
 * 設問データから出題元（出典資料）の名称を導出する
 * 児童・保護者向けに信頼感・高揚感を与える明快な表記（例:「2024年度 安田学園中学校 算数」）を返す
 */
export function getQuestionSource(question?: Partial<SampleQuestion> | null): string {
  if (!question) {
    return '安田学園中学校 入試問題';
  }

  // 1. データ内に明示的な出典が指定されている場合はそれを最優先
  if (question.source && question.source.trim().length > 0) {
    return question.source;
  }

  const subjectName = getSubjectJaName(question.subject);
  const id = question.id || '';

  // 2. IDに年度の明示がある場合（2026, 2025, 2024, 2023, 2022）
  if (id.includes('2026')) {
    return `2026年度 安田学園中学校${subjectName ? ` ${subjectName}` : ''}`;
  }
  if (id.includes('2025')) {
    return `2025年度 安田学園中学校${subjectName ? ` ${subjectName}` : ''}`;
  }
  if (id.includes('2024')) {
    return `2024年度 安田学園中学校${subjectName ? ` ${subjectName}` : ''}`;
  }
  if (id.includes('2023')) {
    return `2023年度 安田学園中学校${subjectName ? ` ${subjectName}` : ''}`;
  }
  if (id.includes('2022')) {
    return `2022年度 安田学園中学校${subjectName ? ` ${subjectName}` : ''}`;
  }

  // 3. 国語（kokugo）の特訓問題は初期2022年度 安田学園中学校の入試問題準拠
  if (question.subject === 'kokugo' || id.includes('kokugo')) {
    return '2022年度 安田学園中学校 国語';
  }

  // 4. その他の特訓カリキュラムおよびサンプル問題は2024年度過去問に準拠
  return `2024年度 安田学園中学校${subjectName ? ` ${subjectName}` : ''}`;
}
