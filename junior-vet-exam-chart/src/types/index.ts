import { z } from 'zod';

export type Subject = 'rika' | 'shakai' | 'sansu' | 'kokugo';

export interface Exam {
  id: string; // e.g. yasuda-2024
  title: string;
  year: number;
  schoolName: string;
  subjects: Subject[];
  timeLimitMinutes: Record<Subject, number>;
}

export interface SourcePage {
  pageNumber: number;
  imagePath: string;
  width: number;
  height: number;
}

export type AnswerType = 'choice' | 'multi_choice' | 'term' | 'numeric' | 'order' | 'open';
export type SlotStatus = 'ok' | 'needs_review';

export interface InventorySlot {
  subject: Subject;
  page: number;
  section: string;
  question: string;
  part: string;
  answerSlotLabel: string;
  answerText: string;
  answerType: AnswerType;
  status: SlotStatus;
  note?: string;
  questionId?: string;
}

export interface Choice {
  id: string;
  label: string; // e.g. "ア", "1"
  text: string;
  isCorrect: boolean;
  distractorRationale?: string;
}

export interface Hint {
  level: 1 | 2;
  text: string;
}

export interface OpenAnswerElement {
  id: string;
  elementText: string; // 模範解答から書き出した要素
}

export interface DiagramRegion {
  id: string;
  label?: string;
  // 多角形の頂点 (0-1 比率座標: [[x1, y1], [x2, y2], ...])
  points: [number, number][];
}

export interface Figure {
  id: string;
  subject: Subject;
  pageNumber: number;
  // ページ上の比率座標 [x, y, width, height]
  cropRect: [number, number, number, number];
  imagePath: string; // relative inside pack
  caption?: string;
  diagramRegions?: DiagramRegion[];
}

export interface Question {
  id: string; // e.g. rika-2024-01-01
  subject: Subject;
  section: string; // 大問
  questionNumber: string; // 小問
  partNumber?: string; // 枝問
  pageNumber: number;
  source?: string;
  prompt: string;
  choices?: Choice[];
  correctAnswer: string | string[];
  answerType: AnswerType;
  figureIds?: string[];
  openElements?: OpenAnswerElement[];
  timeLimitSeconds?: number;
  primarySkillId: string;
  secondarySkillIds?: string[];
}

export interface Answer {
  questionId: string;
  answerText: string | string[];
  explanation: {
    resultSummary: string;
    keyTakeaway: string; // 覚えること（2行以内）
    reasoning: string;   // 考え方（3行以内）
    detailedMarkdown?: string; // 詳しい説明（折りたたみ）
  };
}

export type SkillLevel = 'primary' | 'core';

export interface Skill {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  level: SkillLevel;
  category: string; // 分野
}

export interface SkillDependency {
  skillId: string;
  dependsOnSkillId: string;
}

export type QuestionFormat =
  | 'recall_card'
  | 'delayed_choice'
  | 'multiple_choice'
  | 'why_choice'
  | 'next_step'
  | 'ordering'
  | 'diagram_touch'
  | 'matching'
  | 'numeric_answer'
  | 'self_check';

export type ValidationStatus = 'draft' | 'self_verified' | 'human_verified';

export interface PracticeQuestion {
  id: string;
  skillId: string;
  format: QuestionFormat;
  prompt: string;
  choices?: Choice[];
  correctAnswer: string | string[];
  hints: [Hint, Hint]; // 必ず2段階
  validationStatus: ValidationStatus;
  figureId?: string;
  data?: Record<string, unknown>; // Next Step段階情報やOrdering順序など
}

export interface TransferQuestion {
  id: string;
  sourceQuestionIds: string[];
  requiredSkillIds: string[];
  changedAspects: string[]; // 変更した3項目以上
  expectedReasoning: string;
  prompt: string;
  format: QuestionFormat;
  choices?: Choice[];
  correctAnswer: string | string[];
  distractorRationale?: string;
  hints: [Hint, Hint];
  validationStatus: ValidationStatus;
  figureId?: string;
  data?: Record<string, unknown>;
}

export interface IntegratedQuestion {
  id: string;
  requiredSkillIds: string[]; // 2つ以上の中核Skill
  prompt: string;
  format: QuestionFormat;
  choices?: Choice[];
  correctAnswer: string | string[];
  hints: [Hint, Hint];
  validationStatus: ValidationStatus;
  figureId?: string;
  data?: Record<string, unknown>;
}

export interface Stage2Question {
  id: string;
  correspondsToQuestionId: string;
  requiredSkillIds: string[];
  prompt: string;
  answerType: AnswerType;
  choices?: Choice[];
  correctAnswer: string | string[];
  openElements?: OpenAnswerElement[];
  figureId?: string;
  validationStatus: 'human_verified';
}

export type MasteryStage = 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';

export interface Mastery {
  skillId: string;
  stage: MasteryStage;
  score: number; // 0..100
  lastUpdated: number;
  // 進捗詳細
  consecutiveDirectRecallCount: number; // 選択肢前想起成功数
  whyChoiceSuccessCount: number;
  transferSuccessCount: number;
  differentContextSuccessCount: number;
  m4ReachedAt?: number;
  reviewPass24hAt?: number;
  reviewPass72hAt?: number;
  finalChallengePassedAt?: number;
}

export interface ReviewSchedule {
  skillId: string;
  stageIndex: number; // 0..5 (10分, 1日, 3日, 7日, 16日, 35日)
  nextReviewAt: number; // timestamp
  forgetCount: number;
}

export type ErrorType =
  | 'knowledge_gap'
  | 'term_confusion'
  | 'principle_misunderstood'
  | 'causality_reversed'
  | 'missed_condition'
  | 'diagram_misread'
  | 'graph_misread'
  | 'period_confusion'
  | 'type_unknown'
  | 'focus_unknown'
  | 'method_choice_failed'
  | 'equation_failed'
  | 'calculation_error'
  | 'unit_error'
  | 'choice_misread'
  | 'lucky_guess'
  | 'timeout';

export interface Attempt {
  id?: number;
  questionId: string;
  skillIds: string[];
  timestamp: number;
  response: string | string[] | number | Record<string, unknown>;
  isCorrect: boolean;
  responseTimeMs: number;
  recallDelayMs: number;
  choicesRevealed: boolean;
  hintCount: number;
  selfAssessment?: 'correct' | 'almost' | 'missed' | 'method_correct_calc_miss' | 'partial' | 'dont_know';
  errorTypes?: ErrorType[];
  masteryBefore: number;
  masteryAfter: number;
}

export interface DailySession {
  date: string; // YYYY-MM-DD
  completed: boolean;
  questionIds: string[];
  results: {
    questionId: string;
    isCorrect: boolean;
    directRecall: boolean;
  }[];
}

export interface DiagnosticSession {
  examId: string;
  completed: boolean;
  currentIndex: number;
  answers: Record<string, {
    isCorrect: boolean;
    directRecall: boolean;
  }>;
}

export interface FinalChallengeResult {
  id?: number;
  examId: string;
  stage: 1 | 2;
  timestamp: number;
  score: number;
  totalScore: number;
  passed: boolean;
  questionScores: Record<string, { isCorrect: boolean; userSelfScored?: boolean }>;
}

export interface Settings {
  recallDelaySeconds: number | 'auto'; // 0, 3, 5, 8, 10, 'auto'
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  fontSize: 'standard' | 'large' | 'larger';
  colorVisionSupport: boolean;
  dailyQuestionCount: 5 | 10 | 15;
}

export interface ContentPackManifest {
  packId: string;
  examId: string;
  schemaVersion: string;
  contentVersion: string;
  createdAt: string;
  subjects: {
    subject: Subject;
    timeLimitMinutes: number;
    pageCount: number;
    questionCount: number;
  }[];
  files: {
    path: string;
    sha256: string;
  }[];
  needsReviewCount: number;
}

