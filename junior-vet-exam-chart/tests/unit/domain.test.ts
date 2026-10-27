import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInitialMastery, updateMastery, calculateMasteryScore } from '../../src/domain/mastery';
import { AppClock } from '../../src/domain/clock';
import { calculateNextReview, REVIEW_INTERVALS_MS } from '../../src/domain/review';
import { selectDailyQuestions } from '../../src/domain/daily';
import type { Attempt, Mastery } from '../../src/types';

describe('Domain Logic Tests', () => {
  beforeEach(() => {
    AppClock.reset();
  });

  describe('Clock Protection', () => {
    it('does not move backwards when system clock shifts into the past', () => {
      AppClock.setLastKnownTimestamp(100000);
      vi.spyOn(Date, 'now').mockReturnValue(50000);
      expect(AppClock.now()).toBe(100000);
    });
  });

  describe('Mastery Transitions (M0 -> M6)', () => {
    it('initializes at M0 with 0 score', () => {
      const mastery = createInitialMastery('skill-1');
      expect(mastery.stage).toBe('M0');
      expect(mastery.score).toBe(0);
    });

    it('advances M0 -> M1 upon correct answer with choices revealed', () => {
      const initial = createInitialMastery('skill-1');
      const attempt: Attempt = {
        questionId: 'q-1',
        skillIds: ['skill-1'],
        timestamp: 1000,
        response: 'A',
        isCorrect: true,
        responseTimeMs: 5000,
        recallDelayMs: 0,
        choicesRevealed: true,
        hintCount: 0,
        masteryBefore: 0,
        masteryAfter: 0,
      };

      const updated = updateMastery({
        currentMastery: initial,
        attempt,
        distinctQuestionCount: 1,
        isTransferQuestion: false,
        isWhyOrNextStep: false,
        isFinalChallenge: false,
      });

      expect(updated.stage).toBe('M1');
      expect(updated.score).toBeGreaterThanOrEqual(15);
    });

    it('does not advance past M2 with same question repeated', () => {
      let m = createInitialMastery('skill-1');
      const makeAttempt = (id: string, recall: boolean): Attempt => ({
        questionId: id,
        skillIds: ['skill-1'],
        timestamp: 1000,
        response: 'A',
        isCorrect: true,
        responseTimeMs: 3000,
        recallDelayMs: 0,
        choicesRevealed: !recall,
        hintCount: 0,
        masteryBefore: 0,
        masteryAfter: 0,
      });

      // 1回目の正解
      m = updateMastery({
        currentMastery: m,
        attempt: makeAttempt('q-1', true),
        distinctQuestionCount: 1,
        isTransferQuestion: false,
        isWhyOrNextStep: false,
        isFinalChallenge: false,
      });

      // 同じ問題をもう一度正解（distinctQuestionCountは1のまま）
      m = updateMastery({
        currentMastery: m,
        attempt: makeAttempt('q-1', true),
        distinctQuestionCount: 1,
        isTransferQuestion: false,
        isWhyOrNextStep: false,
        isFinalChallenge: false,
      });

      expect(m.stage).toBe('M1'); // 異なる問題が2問必要なのでM2に上がらない
    });

    it('advances to M2 when direct recall succeeds on 2 distinct questions', () => {
      let m = createInitialMastery('skill-1');
      const makeAttempt = (id: string): Attempt => ({
        questionId: id,
        skillIds: ['skill-1'],
        timestamp: 1000,
        response: 'A',
        isCorrect: true,
        responseTimeMs: 3000,
        recallDelayMs: 0,
        choicesRevealed: false,
        hintCount: 0,
        masteryBefore: 0,
        masteryAfter: 0,
      });

      m = updateMastery({
        currentMastery: m,
        attempt: makeAttempt('q-1'),
        distinctQuestionCount: 1,
        isTransferQuestion: false,
        isWhyOrNextStep: false,
        isFinalChallenge: false,
      });

      m = updateMastery({
        currentMastery: m,
        attempt: makeAttempt('q-2'),
        distinctQuestionCount: 2,
        isTransferQuestion: false,
        isWhyOrNextStep: false,
        isFinalChallenge: false,
      });

      expect(m.stage).toBe('M2');
      expect(m.score).toBeGreaterThanOrEqual(35);
    });

    it('draft transfer questions do not trigger transition to M4', () => {
      let m: Mastery = {
        skillId: 'skill-1',
        stage: 'M3',
        score: 55,
        lastUpdated: 1000,
        consecutiveDirectRecallCount: 2,
        whyChoiceSuccessCount: 2,
        transferSuccessCount: 0,
        differentContextSuccessCount: 0,
      };

      const attempt: Attempt = {
        questionId: 'transfer-1',
        skillIds: ['skill-1'],
        timestamp: 2000,
        response: 'A',
        isCorrect: true,
        responseTimeMs: 4000,
        recallDelayMs: 0,
        choicesRevealed: true,
        hintCount: 0,
        masteryBefore: 55,
        masteryAfter: 55,
      };

      // draft status
      m = updateMastery({
        currentMastery: m,
        attempt,
        distinctQuestionCount: 3,
        isTransferQuestion: true,
        isWhyOrNextStep: false,
        isFinalChallenge: false,
        validationStatus: 'draft',
      });

      expect(m.stage).toBe('M3'); // draftではM4に上がらない
    });

    it('drops by 1 stage on incorrect answer, and drops to M4 if at M5/M6', () => {
      const atM6: Mastery = {
        skillId: 'skill-1',
        stage: 'M6',
        score: 100,
        lastUpdated: 1000,
        consecutiveDirectRecallCount: 2,
        whyChoiceSuccessCount: 2,
        transferSuccessCount: 2,
        differentContextSuccessCount: 2,
      };

      const failAttempt: Attempt = {
        questionId: 'q-1',
        skillIds: ['skill-1'],
        timestamp: 2000,
        response: 'WRONG',
        isCorrect: false,
        responseTimeMs: 4000,
        recallDelayMs: 0,
        choicesRevealed: true,
        hintCount: 0,
        masteryBefore: 100,
        masteryAfter: 0,
      };

      const demoted = updateMastery({
        currentMastery: atM6,
        attempt: failAttempt,
        distinctQuestionCount: 5,
        isTransferQuestion: false,
        isWhyOrNextStep: false,
        isFinalChallenge: false,
      });

      expect(demoted.stage).toBe('M4');
      expect(demoted.score).toBe(75);
    });
  });

  describe('Spaced Review Schedule', () => {
    it('advances review interval when recall is instant and correct', () => {
      const now = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const next = calculateNextReview(null, 'skill-1', true, false, 3000);
      expect(next.stageIndex).toBe(1); // 0から1へ進む
      expect(next.nextReviewAt).toBe(now + REVIEW_INTERVALS_MS[1]);
    });

    it('resets interval and increases forgetCount on mistake', () => {
      const now = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const existing = {
        skillId: 'skill-1',
        stageIndex: 3,
        nextReviewAt: 2000000,
        forgetCount: 1,
      };

      const next = calculateNextReview(existing, 'skill-1', false, true, 5000);
      expect(next.stageIndex).toBe(0);
      expect(next.forgetCount).toBe(2);
      // forgetCount >= 2 なので interval は 0.7倍
      expect(next.nextReviewAt).toBe(now + Math.round(REVIEW_INTERVALS_MS[0] * 0.7));
    });
  });

  describe('Daily Question Selection', () => {
    it('selects requested count and prioritizes overdue review and mistakes', () => {
      const selected = selectDailyQuestions({
        targetCount: 10,
        skills: [{ id: 's1', subject: 'rika', title: '光合成', description: '', level: 'primary', category: '生物' }],
        reviewSchedules: {
          s1: { skillId: 's1', stageIndex: 1, nextReviewAt: Date.now() - 1000, forgetCount: 0 },
        },
        recentAttempts: [
          { questionId: 'm-1', skillIds: ['s1'], timestamp: Date.now(), response: 'X', isCorrect: false, responseTimeMs: 2000, recallDelayMs: 0, choicesRevealed: true, hintCount: 0, masteryBefore: 0, masteryAfter: 0 }
        ],
        practiceQuestions: [
          { id: 'pq-1', skillId: 's1', format: 'multiple_choice', prompt: 'test', correctAnswer: 'A', hints: [{ level: 1, text: 'h1' }, { level: 2, text: 'h2' }], validationStatus: 'self_verified' },
          { id: 'pq-2', skillId: 's1', format: 'multiple_choice', prompt: 'test 2', correctAnswer: 'B', hints: [{ level: 1, text: 'h1' }, { level: 2, text: 'h2' }], validationStatus: 'self_verified' },
          { id: 'pq-3', skillId: 's1', format: 'multiple_choice', prompt: 'test 3', correctAnswer: 'C', hints: [{ level: 1, text: 'h1' }, { level: 2, text: 'h2' }], validationStatus: 'self_verified' },
        ],
        transferQuestions: [],
        integratedQuestions: [],
        unlearnedSkillIds: [],
      });

      expect(selected.length).toBeLessThanOrEqual(10);
      expect(selected.some(s => s.category === 'review' || s.category === 'recent_mistake')).toBe(true);
    });
  });

  describe('Sample Questions Hint Integrity', () => {
    it('hints should guide students without directly revealing the final answer value', async () => {
      const { SAMPLE_QUESTIONS } = await import('../../src/data/sample-data');
      for (const q of SAMPLE_QUESTIONS) {
        expect(q.hints.length).toBe(2);
        for (const hint of q.hints) {
          expect(hint.text.trim().length).toBeGreaterThan(5);

          // 数値問題・選択問題において、ヒント文が直接「= 正解値」を含んでいないこと
          if (q.format === 'numeric_answer' && typeof q.correctAnswer === 'string') {
            expect(hint.text).not.toContain(`= ${q.correctAnswer}`);
          }
          if (q.format === 'multiple_choice' && q.choices) {
            const correctChoice = q.choices.find(c => c.isCorrect);
            if (correctChoice) {
              // 選択肢の完全一致した答えそのものを「= 〇〇」のように明かしていないこと
              expect(hint.text).not.toContain(`= ${correctChoice.text}`);
            }
          }
        }
      }
    });
  });
});

