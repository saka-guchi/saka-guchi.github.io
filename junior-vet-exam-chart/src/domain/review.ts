import { AppClock } from './clock';
import type { ReviewSchedule } from '../types';

export const REVIEW_INTERVALS_MS = [
  10 * 60 * 1000,          // 10分
  1 * 24 * 60 * 60 * 1000,  // 1日
  3 * 24 * 60 * 60 * 1000,  // 3日
  7 * 24 * 60 * 60 * 1000,  // 7日
  16 * 24 * 60 * 60 * 1000, // 16日
  35 * 24 * 60 * 60 * 1000, // 35日
];

export function calculateNextReview(
  currentSchedule: ReviewSchedule | null,
  skillId: string,
  isCorrect: boolean,
  choicesRevealed: boolean,
  responseTimeMs: number
): ReviewSchedule {
  const now = AppClock.now();
  let stageIndex = currentSchedule ? currentSchedule.stageIndex : 0;
  let forgetCount = currentSchedule ? currentSchedule.forgetCount : 0;

  if (!isCorrect) {
    stageIndex = 0;
    forgetCount += 1;
  } else {
    // 選択肢を見ずに即答（directRecall かつ 8秒以内など）
    const isInstantDirectRecall = !choicesRevealed && responseTimeMs < 10000;
    if (isInstantDirectRecall) {
      stageIndex = Math.min(stageIndex + 1, REVIEW_INTERVALS_MS.length - 1);
    }
    // 選択肢を見て正解の場合は同じ stageIndex のまま
  }

  let interval = REVIEW_INTERVALS_MS[stageIndex];
  if (forgetCount >= 2) {
    interval = Math.round(interval * 0.7);
  }

  return {
    skillId,
    stageIndex,
    nextReviewAt: now + interval,
    forgetCount,
  };
}

