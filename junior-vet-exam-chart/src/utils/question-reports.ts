import type { Subject } from '../types';

export interface QuestionReportItem {
  id: string;
  questionId: string;
  prompt: string;
  subject: Subject;
  category?: string;
  skillTitle?: string;
  skillId?: string;
  reason: string;
  reasonLabel: string;
  comment?: string;
  reportedAt: string; // ISO 8601
  resolved: boolean;
}

const STORAGE_KEY = 'junior_vet_question_reports';

/**
 * 登録されている問題修正依頼一覧を取得（新しい順）
 */
export function getQuestionReports(): QuestionReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: QuestionReportItem[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()) : [];
  } catch {
    return [];
  }
}

/**
 * 新しい問題修正依頼を追加
 */
export function addQuestionReport(item: {
  questionId: string;
  prompt: string;
  subject: Subject;
  category?: string;
  skillTitle?: string;
  skillId?: string;
  reason: string;
  reasonLabel: string;
  comment?: string;
}): void {
  try {
    const current = getQuestionReports();
    const newItem: QuestionReportItem = {
      ...item,
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reportedAt: new Date().toISOString(),
      resolved: false,
    };
    current.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

/**
 * 修正依頼の解決済み状態をトグル
 */
export function toggleReportResolved(id: string): QuestionReportItem[] {
  try {
    const list = getQuestionReports();
    const updated = list.map(item =>
      item.id === id ? { ...item, resolved: !item.resolved } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * 修正依頼を削除
 */
export function deleteQuestionReport(id: string): QuestionReportItem[] {
  try {
    const list = getQuestionReports();
    const updated = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

