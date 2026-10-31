import { create } from 'zustand';
import type { Settings, Subject } from '../types';
import { SAMPLE_QUESTIONS, type SampleQuestion } from '../data/sample-data';
import { ALL_CURRICULUM_QUESTIONS } from '../data/curriculum';
import { ALL_PROGRESS_SKILLS } from '../data/all-skills';
import { THEME_ENHANCEMENTS } from '../data/vet-curriculum-enhancement';
import { promoteSkillStage } from '../utils/mastery-helper';

export interface SessionAnswerRecord {
  question: SampleQuestion;
  userAnswer: any;
  isCorrect: boolean;
  directRecall: boolean;
}

export interface PromotedSkillResult {
  skillId: string;
  skillTitle: string;
  prevStage: string;
  newStage: string;
  isMastered: boolean;
}

interface AppState {
  // 設定
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;

  // 現在の学習セッション
  currentSessionQuestions: SampleQuestion[];
  currentIndex: number;
  recallPhase: boolean; // 思い出すフェーズ中か
  hintLevel: 0 | 1 | 2;
  currentAnswered: boolean;
  currentUserAnswer: any;
  currentIsCorrect: boolean | null;
  directRecallCount: number;
  correctCount: number;
  sessionResults: SessionAnswerRecord[];

  // 単元特訓・昇格セッション
  currentFocusSkillId: string | null;
  promotedSkillInfo: PromotedSkillResult | null;

  // セッション操作
  startDailySession: (subject?: Subject) => void;
  startSkillFocusSession: (skillId: string) => void;
  startSingleQuestionSession: (questionId: string) => void;
  startSampleSession: () => void;
  revealChoices: () => void;
  showHint: () => void;
  recordAnswer: (answer: any, isCorrect: boolean, directRecall: boolean) => void;
  nextQuestion: () => boolean; // 次の問題へ。最後の問題ならfalseを返す
  resetSession: () => void;
}

const defaultSettings: Settings = {
  recallDelaySeconds: 'auto',
  soundEnabled: true,
  vibrationEnabled: false,
  fontSize: 'standard',
  colorVisionSupport: false,
  dailyQuestionCount: 10,
  targetExamDate: '2027-02-01',
};

export const useAppStore = create<AppState>((set, get) => ({
  settings: {
    ...defaultSettings,
    ...(() => {
      try {
        const saved = localStorage.getItem('vet_exam_settings');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    })(),
  },

  updateSettings: (newSettings) => {
    set(state => {
      const merged = { ...state.settings, ...newSettings };
      localStorage.setItem('vet_exam_settings', JSON.stringify(merged));
      return { settings: merged };
    });
  },

  currentSessionQuestions: [],
  currentIndex: 0,
  recallPhase: true,
  hintLevel: 0,
  currentAnswered: false,
  currentUserAnswer: null,
  currentIsCorrect: null,
  directRecallCount: 0,
  correctCount: 0,
  sessionResults: [],

  currentFocusSkillId: null,
  promotedSkillInfo: null,

  startDailySession: (subject) => {
    let pool = ALL_CURRICULUM_QUESTIONS;
    if (subject) {
      pool = pool.filter(q => q.subject === subject);
    }
    const count = get().settings.dailyQuestionCount;
    const questions = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    set({
      currentFocusSkillId: null,
      promotedSkillInfo: null,
      currentSessionQuestions: questions,
      currentIndex: 0,
      recallPhase: true,
      hintLevel: 0,
      currentAnswered: false,
      currentUserAnswer: null,
      currentIsCorrect: null,
      directRecallCount: 0,
      correctCount: 0,
      sessionResults: [],
    });
  },

  startSkillFocusSession: (skillId) => {
    const skill = ALL_PROGRESS_SKILLS.find(s => s.id === skillId);
    const enhancement = THEME_ENHANCEMENTS[skillId];

    // そのスキルに合致する問題のみを抽出（他単元の問題が混ざる科目フォールバックは厳禁）
    const matched = ALL_CURRICULUM_QUESTIONS.filter(
      q => q.skillId === skillId || (skill && q.skillTitle === skill.title)
    );

    // 単元特訓用に最大5問を構成
    let focusQuestions: SampleQuestion[] = [...matched].slice(0, 5);

    // もし問題プールに未登録の場合、単元データから特訓問題を安全に生成
    if (focusQuestions.length === 0 && skill) {
      const otherAnswers = Object.values(THEME_ENHANCEMENTS)
        .filter(e => e.subject === skill.subject && e.skillId !== skillId)
        .map(e => e.flashCard.answer);

      focusQuestions = [{
        id: `focus-${skillId}-1`,
        subject: skill.subject,
        format: 'multiple_choice',
        prompt: enhancement?.flashCard.question || `【${skill.title}】の重要ポイントとして最も適切なものはどれですか？`,
        category: skill.category,
        skillTitle: skill.title,
        skillId: skill.id,
        choices: [
          { id: 'c1', label: 'ア', text: enhancement?.flashCard.answer || skill.title, isCorrect: true },
          { id: 'c2', label: 'イ', text: otherAnswers[0] || '誤った組み合わせ', isCorrect: false },
          { id: 'c3', label: 'ウ', text: otherAnswers[1] || '無関係な条件', isCorrect: false },
          { id: 'c4', label: 'エ', text: otherAnswers[2] || '反対の手順', isCorrect: false },
        ],
        correctAnswer: 'c1',
        hints: [
          { level: 1, text: enhancement?.flashCard.tip || '基本原理を思い出そう。' },
          { level: 2, text: enhancement?.flashCard.examPoint || '急所ポイントに着目しよう。' },
        ],
        explanation: {
          resultSummary: '正解です！',
          keyTakeaway: skill.title,
          reasoning: enhancement?.flashCard.examPoint || '急所を正確に押さえましょう。',
        },
      }];
    }

    set({
      currentFocusSkillId: skillId,
      promotedSkillInfo: null,
      currentSessionQuestions: focusQuestions,
      currentIndex: 0,
      recallPhase: true,
      hintLevel: 0,
      currentAnswered: false,
      currentUserAnswer: null,
      currentIsCorrect: null,
      directRecallCount: 0,
      correctCount: 0,
      sessionResults: [],
    });
  },

  startSingleQuestionSession: (questionId) => {
    const question = ALL_CURRICULUM_QUESTIONS.find(q => q.id === questionId);
    if (!question) return;

    set({
      currentFocusSkillId: question.skillId || null,
      promotedSkillInfo: null,
      currentSessionQuestions: [question],
      currentIndex: 0,
      recallPhase: false, // 保護者等の確認時は最初から選択肢を表示してスムーズに確認可能
      hintLevel: 0,
      currentAnswered: false,
      currentUserAnswer: null,
      currentIsCorrect: null,
      directRecallCount: 0,
      correctCount: 0,
      sessionResults: [],
    });
  },

  startSampleSession: () => {
    set({
      currentSessionQuestions: SAMPLE_QUESTIONS,
      currentIndex: 0,
      recallPhase: true,
      hintLevel: 0,
      currentAnswered: false,
      currentUserAnswer: null,
      currentIsCorrect: null,
      directRecallCount: 0,
      correctCount: 0,
      sessionResults: [],
    });
  },

  revealChoices: () => {
    set({ recallPhase: false });
  },

  showHint: () => {
    set(state => ({
      hintLevel: Math.min(state.hintLevel + 1, 2) as 1 | 2,
    }));
  },

  recordAnswer: (answer, isCorrect, directRecall) => {
    set(state => {
      const currentQ = state.currentSessionQuestions[state.currentIndex];
      const newRecord: SessionAnswerRecord = {
        question: currentQ,
        userAnswer: answer,
        isCorrect,
        directRecall,
      };
      const newResults = [...state.sessionResults];
      newResults[state.currentIndex] = newRecord;

      let promotedSkillInfo = state.promotedSkillInfo;
      if (state.currentFocusSkillId && isCorrect && !promotedSkillInfo) {
        const skill = ALL_PROGRESS_SKILLS.find(s => s.id === state.currentFocusSkillId);
        const skillTitle = skill?.title || currentQ?.skillTitle || '重点単元';
        const promo = promoteSkillStage(state.currentFocusSkillId, skillTitle);
        if (promo) {
          promotedSkillInfo = promo;
        }
      }

      return {
        currentAnswered: true,
        currentUserAnswer: answer,
        currentIsCorrect: isCorrect,
        recallPhase: false,
        directRecallCount: directRecall ? state.directRecallCount + 1 : state.directRecallCount,
        correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
        sessionResults: newResults,
        promotedSkillInfo,
      };
    });
  },

  nextQuestion: () => {
    const { currentIndex, currentSessionQuestions } = get();
    if (currentIndex + 1 < currentSessionQuestions.length) {
      set({
        currentIndex: currentIndex + 1,
        recallPhase: true,
        hintLevel: 0,
        currentAnswered: false,
        currentUserAnswer: null,
        currentIsCorrect: null,
      });
      return true;
    }
    return false;
  },

  resetSession: () => {
    set({
      currentSessionQuestions: [],
      currentIndex: 0,
      recallPhase: true,
      hintLevel: 0,
      currentAnswered: false,
      currentUserAnswer: null,
      currentIsCorrect: null,
      sessionResults: [],
      currentFocusSkillId: null,
      promotedSkillInfo: null,
    });
  },
}));

