import type { Mastery, MasteryStage, Attempt } from '../types';

export const MASTERY_BASE_SCORES: Record<MasteryStage, number> = {
  M0: 0,
  M1: 15,
  M2: 35,
  M3: 55,
  M4: 75,
  M5: 90,
  M6: 100,
};

export const STAGE_ORDER: MasteryStage[] = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

export interface MasteryUpdateParams {
  currentMastery: Mastery;
  attempt: Attempt;
  distinctQuestionCount: number;
  isTransferQuestion: boolean;
  isWhyOrNextStep: boolean;
  isFinalChallenge: boolean;
  timeSinceM4Hours?: number;
  timeSinceReviewPass24hHours?: number;
  validationStatus?: 'draft' | 'self_verified' | 'human_verified';
}

export function createInitialMastery(skillId: string): Mastery {
  return {
    skillId,
    stage: 'M0',
    score: 0,
    lastUpdated: Date.now(),
    consecutiveDirectRecallCount: 0,
    whyChoiceSuccessCount: 0,
    transferSuccessCount: 0,
    differentContextSuccessCount: 0,
  };
}

export function calculateMasteryScore(stage: MasteryStage, bonusFraction: number, penalty: boolean): number {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  const base = MASTERY_BASE_SCORES[stage];
  if (currentIndex === STAGE_ORDER.length - 1) {
    return 100;
  }
  const nextStage = STAGE_ORDER[currentIndex + 1];
  const nextBase = MASTERY_BASE_SCORES[nextStage];
  const span = nextBase - base;

  let fraction = Math.min(Math.max(bonusFraction, 0), 1);
  if (penalty) {
    fraction /= 2;
  }

  return Math.round(base + span * fraction);
}

export function updateMastery(params: MasteryUpdateParams): Mastery {
  const {
    currentMastery,
    attempt,
    distinctQuestionCount,
    isTransferQuestion,
    isWhyOrNextStep,
    isFinalChallenge,
    timeSinceM4Hours,
    timeSinceReviewPass24hHours,
    validationStatus,
  } = params;

  const now = attempt.timestamp;
  const updated: Mastery = { ...currentMastery, lastUpdated: now };

  // ペナルティ条件（ヒント使用、回答時間が目安の3倍超、自己判定のみ）
  const hasPenalty =
    attempt.hintCount > 0 ||
    attempt.responseTimeMs > 60000 ||
    (attempt.selfAssessment !== undefined && !attempt.choicesRevealed);

  // 不正解の場合の降格
  if (!attempt.isCorrect) {
    const curIdx = STAGE_ORDER.indexOf(updated.stage);
    if (curIdx > 0) {
      if (updated.stage === 'M6' || updated.stage === 'M5') {
        updated.stage = 'M4';
      } else {
        updated.stage = STAGE_ORDER[curIdx - 1];
      }
    }
    updated.consecutiveDirectRecallCount = 0;
    updated.score = MASTERY_BASE_SCORES[updated.stage];
    return updated;
  }

  // 正解の場合の処理
  // 1. 直接想起（選択肢を見る前）
  if (!attempt.choicesRevealed) {
    updated.consecutiveDirectRecallCount += 1;
  }

  // 2. Why Choice / Next Step
  if (isWhyOrNextStep) {
    updated.whyChoiceSuccessCount += 1;
  }

  // 3. 転用問題（validationStatus が self_verified または human_verified のみ有効）
  const isValidTransfer =
    isTransferQuestion &&
    attempt.hintCount === 0 &&
    (validationStatus === 'self_verified' || validationStatus === 'human_verified');

  if (isValidTransfer) {
    updated.transferSuccessCount += 1;
  }

  // 段階遷移の判定
  let newStage = updated.stage;

  // M0 -> M1: 選択肢を見て正解（または想起正解）
  if (newStage === 'M0') {
    newStage = 'M1';
  }

  // M1 -> M2: 異なる問題2問以上で選択肢を見る前に正しく想起
  if (newStage === 'M1') {
    if (updated.consecutiveDirectRecallCount >= 2 && distinctQuestionCount >= 2) {
      newStage = 'M2';
    }
  }

  // 同じ問題の繰り返し正解では M2 を超えないルール
  if (distinctQuestionCount < 2 && STAGE_ORDER.indexOf(newStage) > 2) {
    newStage = 'M2';
  }

  // M2 -> M3: Why Choice または Next Step で正解（2問以上）
  if (newStage === 'M2') {
    if (updated.whyChoiceSuccessCount >= 2) {
      newStage = 'M3';
    }
  }

  // M3 -> M4: 判定に使える転用問題で、ヒントなし正解（2問以上、題材が異なること）
  if (newStage === 'M3') {
    if (updated.transferSuccessCount >= 2) {
      newStage = 'M4';
      if (!updated.m4ReachedAt) {
        updated.m4ReachedAt = now;
      }
    }
  }

  // M4 -> M5: M4到達から24時間以上空けた復習で正解、さらに72時間以上空けた復習で正解
  if (newStage === 'M4' && updated.m4ReachedAt) {
    if (!updated.reviewPass24hAt && (timeSinceM4Hours ?? 0) >= 24) {
      updated.reviewPass24hAt = now;
    } else if (
      updated.reviewPass24hAt &&
      (timeSinceReviewPass24hHours ?? 0) >= 72
    ) {
      updated.reviewPass72hAt = now;
      newStage = 'M5';
    }
  }

  // M5 -> M6: 本番形式 (Final Challenge) で正解
  if (newStage === 'M5') {
    if (isFinalChallenge) {
      newStage = 'M6';
      updated.finalChallengePassedAt = now;
    }
  }

  updated.stage = newStage;

  // ボーナス進捗計算（次の段階への達成度）
  let bonusFraction = 0;
  if (newStage === 'M1') {
    bonusFraction = Math.min(updated.consecutiveDirectRecallCount / 2, 0.9);
  } else if (newStage === 'M2') {
    bonusFraction = Math.min(updated.whyChoiceSuccessCount / 2, 0.9);
  } else if (newStage === 'M3') {
    bonusFraction = Math.min(updated.transferSuccessCount / 2, 0.9);
  } else if (newStage === 'M4') {
    bonusFraction = updated.reviewPass24hAt ? 0.5 : 0.2;
  } else if (newStage === 'M5') {
    bonusFraction = 0.5;
  }

  updated.score = calculateMasteryScore(newStage, bonusFraction, hasPenalty);

  return updated;
}

