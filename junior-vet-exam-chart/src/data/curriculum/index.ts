import type { StoredPack } from '../../db';
import type { SampleQuestion } from '../sample-data';
import { SAMPLE_QUESTIONS } from '../sample-data';

import questionsData from './questions.json';
import skillsData from './skills.json';
import practiceData from './practice.json';
import transferData from './transfer.json';
import integratedData from './integrated.json';
import stage2Data from './stage2.json';
import figuresData from './figures.json';

// スキル辞書
const skillMap = new Map<string, { title: string; category: string }>();
for (const s of skillsData) {
  skillMap.set(s.id, { title: s.title, category: s.category });
}

// 組み込みパックデータ
export const BUILTIN_YASUDA_PACK: StoredPack = {
  examId: 'yasuda-2024',
  manifest: {
    packId: 'pack-yasuda-2024-1.0.0',
    examId: 'yasuda-2024',
    title: '2024年度 安田学園中学校 入学試験【理科】',
    version: '1.0.0',
    subjects: [{ subject: 'rika', questionCount: questionsData.length }],
    files: [],
  },
  questions: questionsData,
  answers: [],
  figures: figuresData,
  skills: skillsData,
  skillDependencies: [],
  practice: practiceData,
  transfer: transferData,
  integrated: integratedData,
  stage2: stage2Data,
  regions: [],
  images: {
    'figures/fig-rika-01-root.webp': './figures/fig-rika-01-root.webp',
    'figures/fig-rika-01-stem.webp': './figures/fig-rika-01-stem.webp',
    'figures/fig-rika-03-archimedes.webp': './figures/fig-rika-03-archimedes.webp',
    'figures/fig-rika-03-thermometer.webp': './figures/fig-rika-03-thermometer.webp',
    'images/pages/rika/mondai_p001.webp': './pages/rika/mondai_p001.webp',
    'images/pages/rika/mondai_p002.webp': './pages/rika/mondai_p002.webp',
    'images/pages/rika/mondai_p003.webp': './pages/rika/mondai_p003.webp',
    'images/pages/rika/mondai_p004.webp': './pages/rika/mondai_p004.webp',
    'images/pages/rika/mondai_p005.webp': './pages/rika/mondai_p005.webp',
    'images/pages/rika/mondai_p006.webp': './pages/rika/mondai_p006.webp',
    'images/pages/rika/mondai_p007.webp': './pages/rika/mondai_p007.webp',
    'images/pages/rika/kaito_p001.webp': './pages/rika/kaito_p001.webp',
  },
  importedAt: Date.now(),
};

// 演習問題、応用問題、統合問題、過去問を SampleQuestion 形式に正規化して結合
function buildCurriculumQuestions(): SampleQuestion[] {
  const list: SampleQuestion[] = [...SAMPLE_QUESTIONS];

  // 1. 基礎練習問題 (practice.json)
  for (const p of practiceData as any[]) {
    const sInfo = skillMap.get(p.skillId) || { title: '理科の基礎知識', category: '理科' };
    const hints = (p.hints && p.hints.length >= 2)
      ? [p.hints[0], p.hints[1]]
      : [
          { level: 1, text: '落ち着いて問題文のキーワードを確認しよう。' },
          { level: 2, text: '学習した法則や分類を思い出そう。' },
        ];

    list.push({
      id: p.id,
      subject: 'rika',
      format: p.format === 'delayed_choice' ? 'delayed_choice' : (p.choices ? 'multiple_choice' : 'recall_card'),
      prompt: p.prompt,
      category: sInfo.category,
      skillTitle: sInfo.title,
      skillId: p.skillId,
      choices: p.choices,
      correctAnswer: p.correctAnswer,
      hints: hints as any,
      explanation: {
        resultSummary: `正解は【${p.correctAnswer}】です。`,
        keyTakeaway: sInfo.title,
        reasoning: '基礎知識をしっかり頭に定着させましょう。',
      },
      figureUrl: p.figureId ? `./figures/${p.figureId}.webp` : undefined,
    });
  }

  // 2. 転用・応用問題 (transfer.json)
  for (const t of transferData as any[]) {
    const primarySkillId = t.requiredSkillIds?.[0];
    const sInfo = skillMap.get(primarySkillId) || { title: '応用思考力', category: '理科' };
    const hints = (t.hints && t.hints.length >= 2)
      ? [t.hints[0], t.hints[1]]
      : [
          { level: 1, text: '問題文の条件を整理してみよう。' },
          { level: 2, text: '基本原理を別の場面に当てはめてみよう。' },
        ];

    list.push({
      id: t.id,
      subject: 'rika',
      format: t.choices ? 'multiple_choice' : 'recall_card',
      prompt: t.prompt,
      category: sInfo.category,
      skillTitle: sInfo.title,
      skillId: primarySkillId,
      choices: t.choices,
      correctAnswer: t.correctAnswer,
      hints: hints as any,
      explanation: {
        resultSummary: `正解は【${t.correctAnswer}】です。`,
        keyTakeaway: t.expectedReasoning || sInfo.title,
        reasoning: t.expectedReasoning || '条件の違いに着目して考えましょう。',
      },
      figureUrl: t.figureId ? `./figures/${t.figureId}.webp` : undefined,
    });
  }

  // 3. 統合問題 (integrated.json)
  for (const integ of integratedData as any[]) {
    const primarySkillId = integ.requiredSkillIds?.[0];
    const sInfo = skillMap.get(primarySkillId) || { title: '複合問題', category: '理科' };
    const hints = (integ.hints && integ.hints.length >= 2)
      ? [integ.hints[0], integ.hints[1]]
      : [
          { level: 1, text: '複数の知識を組み合わせて考えてみよう。' },
          { level: 2, text: '1つずつ条件を絞り込んでいこう。' },
        ];

    list.push({
      id: integ.id,
      subject: 'rika',
      format: integ.choices ? 'multiple_choice' : 'recall_card',
      prompt: integ.prompt,
      category: sInfo.category,
      skillTitle: sInfo.title,
      skillId: primarySkillId,
      choices: integ.choices,
      correctAnswer: integ.correctAnswer,
      hints: hints as any,
      explanation: {
        resultSummary: `正解は【${integ.correctAnswer}】です。`,
        keyTakeaway: '複数テーマの複合的な理解が必要です。',
        reasoning: '各分野の性質を正確につなげて判断しましょう。',
      },
    });
  }

  return list;
}

export const ALL_CURRICULUM_QUESTIONS: SampleQuestion[] = buildCurriculumQuestions();
