import { create } from 'zustand';
import type { Settings, Subject } from '../types';
import { SAMPLE_QUESTIONS, type SampleQuestion } from '../data/sample-data';
import { ALL_CURRICULUM_QUESTIONS } from '../data/curriculum';

export interface SessionAnswerRecord {
  question: SampleQuestion;
  userAnswer: any;
  isCorrect: boolean;
  directRecall: boolean;
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

  // セッション操作
  startDailySession: (subject?: Subject) => void;
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

  startDailySession: (subject) => {
    let pool = ALL_CURRICULUM_QUESTIONS;
    if (subject) {
      pool = pool.filter(q => q.subject === subject);
    }
    const count = get().settings.dailyQuestionCount;
    const questions = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    set({
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

      return {
        currentAnswered: true,
        currentUserAnswer: answer,
        currentIsCorrect: isCorrect,
        recallPhase: false,
        directRecallCount: directRecall ? state.directRecallCount + 1 : state.directRecallCount,
        correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
        sessionResults: newResults,
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
    });
  },
}));

