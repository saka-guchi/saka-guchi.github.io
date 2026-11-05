import type { ExamYear } from '../data/final-challenge-data';
import type { Subject } from '../types';

export const PENDING_REVIEW_VERSION = 1;

export interface PendingReviewData {
  version: typeof PENDING_REVIEW_VERSION;
  year: ExamYear;
  subject: Subject;
  answers: Record<string, string>;
  rubricChecks: Record<string, Record<number, boolean>>;
  markedZeroSlots: Record<string, boolean>; // 「どれも書けなかった」を押した記述スロット
  isTimeUpSubmitted: boolean;
  timestamp: number;
}

export interface FinalizedReviewData {
  version: typeof PENDING_REVIEW_VERSION;
  year: ExamYear;
  subject: Subject;
  answers: Record<string, string>;
  rubricChecks: Record<string, Record<number, boolean>>;
  markedZeroSlots: Record<string, boolean>;
  isTimeUpSubmitted: boolean;
  lastExamResult: {
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
  };
  hasMasterBadge: boolean;
  timestamp: number;
}

export interface PausedAnsweringData {
  version: typeof PENDING_REVIEW_VERSION;
  year: ExamYear;
  subject: Subject;
  answers: Record<string, string>;
  currentPage: number;
  remainingSeconds: number;
  timestamp: number;
}

export function getPendingReviewStorageKey(year: ExamYear, subject: Subject): string {
  return `jvet:final-challenge-pending:${year}:${subject}`;
}

export function getFinalizedReviewStorageKey(year: ExamYear, subject: Subject): string {
  return `jvet:final-challenge-finalized:${year}:${subject}`;
}

export function getPausedAnsweringStorageKey(year: ExamYear, subject: Subject): string {
  return `jvet:final-challenge-answering:${year}:${subject}`;
}

export function loadPendingReview(year: ExamYear, subject: Subject): PendingReviewData | null {
  try {
    const key = getPendingReviewStorageKey(year, subject);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== PENDING_REVIEW_VERSION ||
      parsed.year !== year ||
      parsed.subject !== subject
    ) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      version: PENDING_REVIEW_VERSION,
      year: parsed.year,
      subject: parsed.subject,
      answers: typeof parsed.answers === 'object' && parsed.answers !== null ? parsed.answers : {},
      rubricChecks:
        typeof parsed.rubricChecks === 'object' && parsed.rubricChecks !== null ? parsed.rubricChecks : {},
      markedZeroSlots:
        typeof parsed.markedZeroSlots === 'object' && parsed.markedZeroSlots !== null
          ? parsed.markedZeroSlots
          : {},
      isTimeUpSubmitted: Boolean(parsed.isTimeUpSubmitted),
      timestamp: Number(parsed.timestamp) || Date.now(),
    };
  } catch (err) {
    console.warn('[loadPendingReview] Failed to load pending review:', err);
    return null;
  }
}

export function savePendingReview(data: PendingReviewData): boolean {
  try {
    const key = getPendingReviewStorageKey(data.year, data.subject);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('[savePendingReview] Failed to save pending review:', err);
    return false;
  }
}

export function clearPendingReview(year: ExamYear, subject: Subject): void {
  try {
    const key = getPendingReviewStorageKey(year, subject);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[clearPendingReview] Failed to clear pending review:', err);
  }
}

export function loadFinalizedReview(year: ExamYear, subject: Subject): FinalizedReviewData | null {
  try {
    const key = getFinalizedReviewStorageKey(year, subject);
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== PENDING_REVIEW_VERSION ||
      parsed.year !== year ||
      parsed.subject !== subject ||
      !parsed.lastExamResult
    ) {
      sessionStorage.removeItem(key);
      return null;
    }

    return {
      version: PENDING_REVIEW_VERSION,
      year: parsed.year,
      subject: parsed.subject,
      answers: typeof parsed.answers === 'object' && parsed.answers !== null ? parsed.answers : {},
      rubricChecks:
        typeof parsed.rubricChecks === 'object' && parsed.rubricChecks !== null ? parsed.rubricChecks : {},
      markedZeroSlots:
        typeof parsed.markedZeroSlots === 'object' && parsed.markedZeroSlots !== null
          ? parsed.markedZeroSlots
          : {},
      isTimeUpSubmitted: Boolean(parsed.isTimeUpSubmitted),
      lastExamResult: parsed.lastExamResult,
      hasMasterBadge: Boolean(parsed.hasMasterBadge),
      timestamp: Number(parsed.timestamp) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveFinalizedReview(data: FinalizedReviewData): boolean {
  try {
    const key = getFinalizedReviewStorageKey(data.year, data.subject);
    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearFinalizedReview(year: ExamYear, subject: Subject): void {
  try {
    const key = getFinalizedReviewStorageKey(year, subject);
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadPausedAnswering(year: ExamYear, subject: Subject): PausedAnsweringData | null {
  try {
    const key = getPausedAnsweringStorageKey(year, subject);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== PENDING_REVIEW_VERSION ||
      parsed.year !== year ||
      parsed.subject !== subject
    ) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      version: PENDING_REVIEW_VERSION,
      year: parsed.year,
      subject: parsed.subject,
      answers: typeof parsed.answers === 'object' && parsed.answers !== null ? parsed.answers : {},
      currentPage: Number(parsed.currentPage) || 1,
      remainingSeconds: Number(parsed.remainingSeconds) || 0,
      timestamp: Number(parsed.timestamp) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function savePausedAnswering(data: PausedAnsweringData): boolean {
  try {
    const key = getPausedAnsweringStorageKey(data.year, data.subject);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearPausedAnswering(year: ExamYear, subject: Subject): void {
  try {
    const key = getPausedAnsweringStorageKey(year, subject);
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * 指定された年度・教科に「判定中」または「解答一時保存中」のデータが存在するか判定する
 */
export function hasInProgressExam(year: ExamYear, subject: Subject): boolean {
  return loadPendingReview(year, subject) !== null || loadPausedAnswering(year, subject) !== null;
}
