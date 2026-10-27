import Dexie, { type EntityTable } from 'dexie';
import type { Attempt, Mastery, ReviewSchedule, DailySession, DiagnosticSession, FinalChallengeResult } from '../types';

export interface StoredPack {
  examId: string;
  manifest: any;
  questions: any[];
  answers: any[];
  figures: any[];
  skills: any[];
  skillDependencies: any[];
  practice: any[];
  transfer: any[];
  integrated: any[];
  stage2: any[];
  regions: any[];
  images: Record<string, string>; // path -> dataUrl / blobUrl
  importedAt: number;
}

class ExamChartDatabase extends Dexie {
  attempts!: EntityTable<Attempt, 'id'>;
  masteries!: EntityTable<Mastery, 'skillId'>;
  reviewSchedules!: EntityTable<ReviewSchedule, 'skillId'>;
  dailySessions!: EntityTable<DailySession, 'date'>;
  diagnosticSessions!: EntityTable<DiagnosticSession, 'examId'>;
  finalChallengeResults!: EntityTable<FinalChallengeResult, 'id'>;
  contentPacks!: EntityTable<StoredPack, 'examId'>;

  constructor() {
    super('JuniorVetExamChartDB');
    this.version(1).stores({
      attempts: '++id, questionId, timestamp, isCorrect',
      masteries: 'skillId, stage, score, lastUpdated',
      reviewSchedules: 'skillId, nextReviewAt, stageIndex',
      dailySessions: 'date, completed',
      diagnosticSessions: 'examId, completed',
      finalChallengeResults: '++id, examId, stage, timestamp, passed',
      contentPacks: 'examId, importedAt'
    });
  }
}

export const db = new ExamChartDatabase();

export async function ensureBuiltinPackLoaded(force = false): Promise<void> {
  try {
    const existing = await db.contentPacks.get('yasuda-2024');
    if (!existing || force) {
      const { BUILTIN_YASUDA_PACK } = await import('../data/curriculum');
      await db.contentPacks.put(BUILTIN_YASUDA_PACK);
    }
  } catch (err) {
    console.warn('Failed to auto-load builtin pack into IndexedDB:', err);
  }
}

