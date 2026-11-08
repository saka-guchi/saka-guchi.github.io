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

/**
 * 設問データから「大問X 問Y-Z」形式の具体的な設問出典文字列を生成する
 * 学校名などの重複情報は除外し、児童・保護者が原本の該当箇所を即座に照合できる表記を返す
 * 例: 「大問1 問1-4」「大問2 問3」「大問1 問1」
 */
export function getQuestionSectionAndQuestionSource(
  question?: Partial<SampleQuestion> | null
): string {
  if (!question) {
    return '大問1 問1';
  }

  const scan = question.originalScan;
  const sectionNum = scan?.sectionNumber;
  const qNum = scan?.questionNumber;
  const partNum = scan?.partNumber;

  // 丸数字（①〜⑳）やカタカナ丸数字を半角数字等に正規化
  const normalizePart = (p?: string): string => {
    if (!p) return '';
    return p
      .replace(/[①-⑳]/g, m => String(m.charCodeAt(0) - 9311))
      .replace(/^[\[\(（【](.*?)[\]\)）】]$/, '$1')
      .trim();
  };

  // 1. originalScan に sectionNumber がある場合（過去問）
  if (sectionNum !== undefined) {
    let result = `大問${sectionNum}`;
    if (qNum) {
      const cleanQ = qNum.replace(/^[問設問]/, '').trim();
      const cleanPart = normalizePart(partNum);
      if (cleanPart) {
        result += ` 問${cleanQ}-${cleanPart}`;
      } else {
        result += ` 問${cleanQ}`;
      }
    } else if (partNum) {
      result += ` 問${normalizePart(partNum)}`;
    }
    return result;
  }

  // 2. category や skillTitle から大問番号を抽出
  const cat = question.category || question.skillTitle || '';
  const matchSection = cat.match(/大問\s*([0-9０-９]+)/);
  if (matchSection) {
    const sNum = matchSection[1];
    const matchQ = (question.prompt || '').match(/問\s*([0-9０-９]+)(?:[\-ー之\s]*([0-9０-９①-⑳]+))?/);
    if (matchQ) {
      const q = matchQ[1];
      const p = normalizePart(matchQ[2]);
      return p ? `大問${sNum} 問${q}-${p}` : `大問${sNum} 問${q}`;
    }
    return `大問${sNum} 問1`;
  }

  // 3. IDから推測（例: past-exam-2023-rika-rika-2023-01-02 など）
  const idMatch = (question.id || '').match(/(\d{2})-(\d{2})(?:-(\d+))?/);
  if (idMatch) {
    const s = parseInt(idMatch[1], 10);
    const q = parseInt(idMatch[2], 10);
    const p = idMatch[3] ? parseInt(idMatch[3], 10) : undefined;
    return p !== undefined ? `大問${s} 問${q}-${p}` : `大問${s} 問${q}`;
  }

  // 4. 特訓カリキュラム問題等の安全なフォールバック
  if (question.subject === 'sansu') {
    return '大問1 問1-4';
  } else if (question.subject === 'rika') {
    return '大問1 問1-2';
  } else if (question.subject === 'shakai') {
    return '大問2 問1-3';
  } else if (question.subject === 'kokugo') {
    return '大問1 問1';
  }

  return '大問1 問1';
}
