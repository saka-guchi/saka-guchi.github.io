import type { Skill, ReviewSchedule, Attempt, PracticeQuestion, TransferQuestion, IntegratedQuestion } from '../types';
import { AppClock } from './clock';

export interface DailySelectParams {
  targetCount: 5 | 10 | 15;
  skills: Skill[];
  reviewSchedules: Record<string, ReviewSchedule>;
  recentAttempts: Attempt[];
  practiceQuestions: PracticeQuestion[];
  transferQuestions: TransferQuestion[];
  integratedQuestions: IntegratedQuestion[];
  unlearnedSkillIds: string[];
}

export interface SelectedQuestionItem {
  id: string;
  category: 'review' | 'recent_mistake' | 'new_skill' | 'transfer' | 'integrated';
  type: 'practice' | 'transfer' | 'integrated';
  skillId?: string;
}

export function selectDailyQuestions(params: DailySelectParams): SelectedQuestionItem[] {
  const {
    targetCount,
    reviewSchedules,
    recentAttempts,
    practiceQuestions,
    transferQuestions,
    integratedQuestions,
    unlearnedSkillIds,
  } = params;

  const now = AppClock.now();
  const selected: SelectedQuestionItem[] = [];
  const selectedQuestionIds = new Set<string>();

  // 10問基準の比率 (5問なら半分、15問なら1.5倍)
  const ratio = targetCount / 10;
  const countReview = Math.round(3 * ratio);
  const countMistake = Math.round(2 * ratio);
  const countNew = Math.round(2 * ratio);
  const countTransfer = Math.round(2 * ratio);
  const countIntegrated = targetCount - (countReview + countMistake + countNew + countTransfer);

  // 1. 忘れかけ（期日が過ぎている、または直近の復習予定）
  const overdueSchedules = Object.values(reviewSchedules)
    .filter(s => s.nextReviewAt <= now + 3600000)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);

  for (const sched of overdueSchedules) {
    if (selected.filter(x => x.category === 'review').length >= countReview) break;
    const q = practiceQuestions.find(pq => pq.skillId === sched.skillId && !selectedQuestionIds.has(pq.id));
    if (q) {
      selected.push({ id: q.id, category: 'review', type: 'practice', skillId: sched.skillId });
      selectedQuestionIds.add(q.id);
    }
  }

  // 2. 前回の誤答
  const failedAttempts = [...recentAttempts].reverse().filter(a => !a.isCorrect);
  for (const fa of failedAttempts) {
    if (selected.filter(x => x.category === 'recent_mistake').length >= countMistake) break;
    if (!selectedQuestionIds.has(fa.questionId)) {
      selected.push({ id: fa.questionId, category: 'recent_mistake', type: 'practice' });
      selectedQuestionIds.add(fa.questionId);
    }
  }

  // 3. 新しいSkill
  for (const skillId of unlearnedSkillIds) {
    if (selected.filter(x => x.category === 'new_skill').length >= countNew) break;
    const q = practiceQuestions.find(pq => pq.skillId === skillId && !selectedQuestionIds.has(pq.id));
    if (q) {
      selected.push({ id: q.id, category: 'new_skill', type: 'practice', skillId });
      selectedQuestionIds.add(q.id);
    }
  }

  // 4. 転用問題
  for (const tq of transferQuestions) {
    if (selected.filter(x => x.category === 'transfer').length >= countTransfer) break;
    if (!selectedQuestionIds.has(tq.id)) {
      selected.push({ id: tq.id, category: 'transfer', type: 'transfer' });
      selectedQuestionIds.add(tq.id);
    }
  }

  // 5. 統合問題
  for (const iq of integratedQuestions) {
    if (selected.filter(x => x.category === 'integrated').length >= countIntegrated) break;
    if (!selectedQuestionIds.has(iq.id)) {
      selected.push({ id: iq.id, category: 'integrated', type: 'integrated' });
      selectedQuestionIds.add(iq.id);
    }
  }

  // 不足分は「忘れかけ → 誤答 → 新しいSkill」の順で補う
  if (selected.length < targetCount) {
    for (const pq of practiceQuestions) {
      if (selected.length >= targetCount) break;
      if (!selectedQuestionIds.has(pq.id)) {
        selected.push({ id: pq.id, category: 'review', type: 'practice', skillId: pq.skillId });
        selectedQuestionIds.add(pq.id);
      }
    }
  }

  return selected.slice(0, targetCount);
}

